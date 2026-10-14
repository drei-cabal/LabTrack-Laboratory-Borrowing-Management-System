import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { StaffEntity, CreateStaffPayload, UpdateStaffPayload, StaffRole } from '../types';

interface UserDbRow {
  id: string;
  username: string;
  password_hash: string;
  role: StaffRole;
  full_name: string | null;
  is_active: number;
  created_at: string;
}

function toStaffEntity(row: UserDbRow): StaffEntity {
  return {
    id: row.id,
    username: row.username,
    full_name: row.full_name || row.username,
    role: row.role,
    is_active: row.is_active === 1,
    created_at: row.created_at,
  };
}

export const staffRepository = {
  /**
   * Retrieves all staff accounts with optional filtering by search query and role.
   */
  getAll(search?: string, role?: string): StaffEntity[] {
    let sql = 'SELECT id, username, password_hash, role, full_name, is_active, created_at FROM users WHERE 1=1';
    const params: any[] = [];

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(full_name) LIKE ? OR LOWER(username) LIKE ?)';
      params.push(term, term);
    }

    if (role && role.trim()) {
      sql += ' AND role = ?';
      params.push(role.trim());
    }

    // Admins first, then by creation date
    sql += ' ORDER BY CASE WHEN role = \'admin\' THEN 0 ELSE 1 END, created_at ASC';

    const rows = db.prepare<any[], UserDbRow>(sql).all(...params);
    return rows.map(toStaffEntity);
  },

  /**
   * Retrieves a staff member by ID.
   */
  getById(id: string): StaffEntity | null {
    const row = db
      .prepare<[string], UserDbRow>(
        'SELECT id, username, password_hash, role, full_name, is_active, created_at FROM users WHERE id = ?'
      )
      .get(id);

    return row ? toStaffEntity(row) : null;
  },

  /**
   * Retrieves a staff member by username.
   */
  getByUsername(username: string): (StaffEntity & { password_hash: string }) | null {
    const row = db
      .prepare<[string], UserDbRow>(
        'SELECT id, username, password_hash, role, full_name, is_active, created_at FROM users WHERE LOWER(username) = LOWER(?)'
      )
      .get(username);

    if (!row) return null;
    return {
      ...toStaffEntity(row),
      password_hash: row.password_hash,
    };
  },

  /**
   * Counts currently active admin accounts.
   */
  countActiveAdmins(): number {
    const row = db
      .prepare<[], { count: number }>(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1"
      )
      .get();
    return row ? Number(row.count) : 0;
  },

  /**
   * Creates a new staff member.
   */
  create(data: CreateStaffPayload): StaffEntity {
    // Normalise username: strip leading @ if provided, convert to lowercase
    const cleanUsername = data.username.replace(/^@/, '').trim().toLowerCase();
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(data.password, 10);
    const now = new Date().toISOString();
    const role = data.role === 'admin' ? 'admin' : 'assistant';
    const fullName = data.full_name.trim();

    db.prepare(
      `INSERT INTO users (id, username, password_hash, role, full_name, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`
    ).run(id, cleanUsername, passwordHash, role, fullName, now);

    return {
      id,
      username: cleanUsername,
      full_name: fullName,
      role,
      is_active: true,
      created_at: now,
    };
  },

  /**
   * Updates an existing staff member.
   */
  update(id: string, data: UpdateStaffPayload): StaffEntity | null {
    const current = this.getById(id);
    if (!current) return null;

    const fields: string[] = [];
    const params: any[] = [];

    if (data.full_name !== undefined) {
      fields.push('full_name = ?');
      params.push(data.full_name.trim());
    }

    if (data.username !== undefined) {
      const cleanUsername = data.username.replace(/^@/, '').trim().toLowerCase();
      fields.push('username = ?');
      params.push(cleanUsername);
    }

    if (data.role !== undefined) {
      fields.push('role = ?');
      params.push(data.role);
    }

    if (data.password !== undefined && data.password.trim() !== '') {
      fields.push('password_hash = ?');
      params.push(bcrypt.hashSync(data.password.trim(), 10));
    }

    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return current;
    }

    params.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);

    return this.getById(id);
  },

  /**
   * Toggles the active status of a staff member.
   */
  toggleStatus(id: string, isActive: boolean): StaffEntity | null {
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
    return this.getById(id);
  },

  /**
   * Deletes a staff member by ID.
   */
  delete(id: string): boolean {
    const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return res.changes > 0;
  },
};
