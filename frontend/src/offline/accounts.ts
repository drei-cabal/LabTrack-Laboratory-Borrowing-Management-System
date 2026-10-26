import bcrypt from 'bcryptjs';
import { getRandomBytes, randomUUID } from 'expo-crypto';
import type { StaffEntity } from '../types';
import { getLocalDatabase } from './database';
import { LocalError, optionalText, text } from './validation';

bcrypt.setRandomFallback(length => Array.from(getRandomBytes(length)));

interface UserRow extends Omit<StaffEntity, 'is_active'> {
  password_hash: string;
  is_active: number;
}

function publicUser(row: UserRow): StaffEntity {
  return { id: row.id, username: row.username, full_name: row.full_name, email: row.email,
    role: row.role, is_active: row.is_active === 1, created_at: row.created_at };
}

export function needsSetup(): boolean {
  return getLocalDatabase().getFirstSync<{ count: number }>('SELECT COUNT(*) AS count FROM users')!.count === 0;
}

export function getStaff(): StaffEntity[] {
  return getLocalDatabase().getAllSync<UserRow>('SELECT * FROM users ORDER BY full_name COLLATE NOCASE').map(publicUser);
}

export function findStaff(id: string): StaffEntity {
  const user = getStaff().find(user => user.id === id);
  if (!user) throw new LocalError('Staff member not found.', 404);
  return user;
}

export function getSessionUser(token?: string | null): StaffEntity {
  if (!token) throw new LocalError('Please sign in to continue.', 401);
  const row = getLocalDatabase().getFirstSync<UserRow>(`
    SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id
    WHERE s.token=? AND s.expires_at>? AND u.is_active=1
  `, token, new Date().toISOString());
  if (!row) throw new LocalError('Your session has ended. Please sign in again.', 401);
  return publicUser(row);
}

function createSession(user: StaffEntity) {
  const db = getLocalDatabase();
  const token = randomUUID();
  db.runSync('DELETE FROM sessions WHERE expires_at<=?', new Date().toISOString());
  db.runSync('INSERT INTO sessions VALUES (?,?,?)', token, user.id, new Date(Date.now() + 7 * 86400000).toISOString());
  return { token, user };
}

export function endSession(token?: string | null): boolean {
  if (token) getLocalDatabase().runSync('DELETE FROM sessions WHERE token=?', token);
  return true;
}

function checkedPassword(value: unknown, minimum = 6): string {
  if (typeof value !== 'string' || value.length < minimum || bcrypt.truncates(value)) {
    throw new LocalError(`Password must be at least ${minimum} characters and no longer than 72 bytes.`);
  }
  return value;
}

export async function signIn(body: Record<string, unknown>) {
  const username = text(body.username, 'Username').replace(/^@/, '').toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const user = getLocalDatabase().getFirstSync<UserRow>('SELECT * FROM users WHERE username=?', username);
  if (!user || !user.is_active || !await bcrypt.compare(password, user.password_hash)) {
    throw new LocalError('Invalid username or password, or account is inactive.', 401);
  }
  return createSession(publicUser(user));
}

export async function saveStaff(body: Record<string, unknown>, id?: string): Promise<StaffEntity> {
  const db = getLocalDatabase();
  const existing = id ? findStaff(id) : undefined;
  const username = text(body.username ?? existing?.username, 'Username', 3).replace(/^@/, '').toLowerCase();
  const fullName = text(body.full_name ?? existing?.full_name, 'Full name', 2);
  const email = optionalText(body.email ?? existing?.email).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new LocalError('Please enter a valid email address.');
  const role = body.role ?? existing?.role ?? 'assistant';
  if (role !== 'admin' && role !== 'assistant') throw new LocalError('Please choose a valid staff role.');
  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') throw new LocalError('Active status must be true or false.');
  const active = body.is_active === undefined ? existing?.is_active ?? true : body.is_active;
  if (db.getFirstSync('SELECT id FROM users WHERE username=? AND id!=?', username, id ?? '')) {
    throw new LocalError('Username is already in use.', 409);
  }
  if (existing?.role === 'admin' && existing.is_active && (role !== 'admin' || !active)) {
    protectLastAdmin(existing.id);
  }
  let passwordHash: string | undefined;
  if (!existing || body.password) passwordHash = await bcrypt.hash(checkedPassword(body.password), 10);
  const userId = id || randomUUID();
  if (existing) {
    db.runSync('UPDATE users SET username=?,full_name=?,email=?,role=?,is_active=?,password_hash=COALESCE(?,password_hash) WHERE id=?', username, fullName, email, role, active ? 1 : 0, passwordHash ?? null, userId);
    if (!active) db.runSync('DELETE FROM sessions WHERE user_id=?', userId);
  } else {
    db.runSync('INSERT INTO users VALUES (?,?,?,?,?,?,?,?)', userId, username, passwordHash!, role, fullName, email, active ? 1 : 0, new Date().toISOString());
  }
  return findStaff(userId);
}

function protectLastAdmin(id: string): void {
  const admins = getStaff().filter(user => user.role === 'admin' && user.is_active && user.id !== id);
  if (!admins.length) throw new LocalError('Cannot remove or deactivate the last active administrator.');
}

export function deleteStaff(id: string) {
  const user = findStaff(id);
  if (user.role === 'admin' && user.is_active) protectLastAdmin(id);
  getLocalDatabase().runSync('DELETE FROM users WHERE id=?', id);
  return { id };
}

export async function setUpAdministrator(body: Record<string, unknown>) {
  checkedPassword(body.password, 8);
  const username = text(body.username, 'Username', 3).replace(/^@/, '').toLowerCase();
  const fullName = text(body.full_name, 'Full name', 2);
  const hash = await bcrypt.hash(body.password as string, 10);
  const db = getLocalDatabase();
  let result!: ReturnType<typeof createSession>;
  db.withTransactionSync(() => {
    if (!needsSetup()) throw new LocalError('Administrator setup has already been completed.', 409);
    const id = randomUUID();
    db.runSync('INSERT INTO users VALUES (?,?,?,?,?,?,?,?)', id, username, hash, 'admin', fullName, '', 1, new Date().toISOString());
    result = createSession(findStaff(id));
  });
  return result;
}
