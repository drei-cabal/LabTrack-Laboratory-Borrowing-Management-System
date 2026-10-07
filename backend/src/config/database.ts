/**
 * database.ts
 *
 * sql.js (WASM-based SQLite — no native compilation needed) wrapper that
 * exposes a better-sqlite3-compatible API so the repository layer is unchanged.
 *
 * Persistence: after every write the DB is serialised and saved to DB_PATH.
 * Reads: on startup, if DB_PATH exists the buffer is loaded into sql.js.
 */

import initSqlJs, { Database, QueryExecResult } from 'sql.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RunResult {
  changes: number;
}

/** Mimics better-sqlite3's PreparedStatement */
export interface PreparedStatement<P = any[], R = any> {
  all(...params: any[]): R[];
  get(...params: any[]): R | undefined;
  run(...params: any[]): RunResult;
}

// ─── Wrapper class ────────────────────────────────────────────────────────────

export class SqlJsDatabase {
  private inner: Database;
  private filePath: string;

  constructor(inner: Database, filePath: string) {
    this.inner = inner;
    this.filePath = filePath;
  }

  /** Save the in-memory DB back to disk after every mutation */
  private persist(): void {
    const data = this.inner.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
  }

  /**
   * Returns a prepared-statement-like object whose .all() / .get() / .run()
   * methods accept positional params, exactly like better-sqlite3.
   */
  prepare<P = any[], R = any>(sql: string): PreparedStatement<P, R> {
    const inner = this.inner;
    const persist = this.persist.bind(this);

    return {
      all(...params: any[]): R[] {
        const stmt = inner.prepare(sql);
        const results: R[] = [];
        if (params.length) stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject() as unknown as R);
        }
        stmt.free();
        return results;
      },

      get(...params: any[]): R | undefined {
        const stmt = inner.prepare(sql);
        if (params.length) stmt.bind(params);
        let result: R | undefined;
        if (stmt.step()) {
          result = stmt.getAsObject() as unknown as R;
        }
        stmt.free();
        return result;
      },

      run(...params: any[]): RunResult {
        inner.run(sql, params);
        const changes = inner.getRowsModified();
        persist();
        return { changes };
      },
    };
  }

  /** Execute raw SQL (no params, multiple statements allowed) */
  exec(sql: string): QueryExecResult[] {
    const result = this.inner.exec(sql);
    this.persist();
    return result;
  }

  /** Enable PRAGMA (no-op on first run for WAL — sql.js uses different journaling) */
  pragma(statement: string): void {
    try {
      this.inner.run(`PRAGMA ${statement}`);
    } catch {
      // Some PRAGMAs are not supported in sql.js WASM — silently ignore
    }
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    description TEXT NOT NULL DEFAULT '',
    total_quantity INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS borrow_records (
    id TEXT PRIMARY KEY,
    equipment_id TEXT NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_id TEXT NOT NULL,
    borrow_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'borrowed',
    notes TEXT,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
  );
`;

// ─── Seed ─────────────────────────────────────────────────────────────────────

function seedIfEmpty(db: SqlJsDatabase): void {
  const countRow = db.prepare<[], { count: number }>('SELECT COUNT(*) as count FROM users').get();
  const count = countRow ? Number(countRow.count) : 0;
  if (count > 0) return;

  const now = new Date().toISOString();

  // Users
  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const usersToSeed = [
    { username: 'admin.cruz', password: 'admin123', role: 'admin' },
    { username: 'prof.cruz',  password: 'prof123',  role: 'staff' },
    { username: 'admin',      password: 'admin123', role: 'admin' },
  ];
  for (const u of usersToSeed) {
    const hash = bcrypt.hashSync(u.password, 10);
    insertUser.run(uuidv4(), u.username, hash, u.role, now);
  }

  // Equipment
  const insertEquipment = db.prepare(
    `INSERT INTO equipment (id, product_id, name, brand, model, description, total_quantity, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const eq1Id = uuidv4(); const eq2Id = uuidv4();
  const eq3Id = uuidv4(); const eq4Id = uuidv4();

  const equipmentToSeed = [
    { id: eq1Id, pid: 'EQ-001', name: 'Digital Multimeter',    brand: 'Fluke', model: '117 True RMS', desc: 'Digital multimeter for electrical measurements', qty: 5 },
    { id: eq2Id, pid: 'EQ-002', name: 'Oscilloscope',           brand: 'Rigol', model: 'DS1054Z',      desc: 'Digital oscilloscope with 4 channels',          qty: 2 },
    { id: eq3Id, pid: 'EQ-003', name: 'Function Generator',     brand: 'Rigol', model: 'DG1022Z',      desc: 'Arbitrary waveform function generator',          qty: 3 },
    { id: eq4Id, pid: 'EQ-004', name: 'Soldering Iron Station', brand: 'Hakko', model: 'FX-888D',      desc: 'Temperature-controlled soldering station',       qty: 4 },
  ];
  for (const eq of equipmentToSeed) {
    insertEquipment.run(eq.id, eq.pid, eq.name, eq.brand, eq.model, eq.desc, eq.qty, now, now);
  }

  // Borrow records
  const insertRecord = db.prepare(
    `INSERT INTO borrow_records (id, equipment_id, borrower_name, borrower_id, borrow_date, due_date, return_date, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const daysAgo  = (n: number) => fmt(new Date(Date.now() - n * 86_400_000));
  const daysFrom = (n: number) => fmt(new Date(Date.now() + n * 86_400_000));

  const records = [
    { eqId: eq1Id, name: 'Juan Dela Cruz',  bid: '2021-00001', bd: daysAgo(5),  dd: daysFrom(2), status: 'borrowed', notes: 'For electronics lab' },
    { eqId: eq1Id, name: 'Maria Santos',    bid: '2021-00002', bd: daysAgo(10), dd: daysAgo(3),  status: 'overdue',  notes: null },
    { eqId: eq1Id, name: 'Jose Rizal',      bid: '2021-00003', bd: daysAgo(3),  dd: daysFrom(4), status: 'borrowed', notes: 'Lab project' },
    { eqId: eq2Id, name: 'Ana Reyes',       bid: '2021-00004', bd: daysAgo(7),  dd: daysFrom(1), status: 'borrowed', notes: null },
    { eqId: eq2Id, name: 'Pedro Penduko',   bid: '2021-00005', bd: daysAgo(14), dd: daysAgo(7),  status: 'overdue',  notes: 'Signal analysis' },
    { eqId: eq3Id, name: 'Cardo Dalisay',   bid: '2021-00006', bd: daysAgo(2),  dd: daysFrom(5), status: 'borrowed', notes: 'Frequency testing' },
    { eqId: eq4Id, name: 'Narda Cruz',      bid: '2021-00007', bd: daysAgo(20), dd: daysAgo(13), status: 'overdue',  notes: 'PCB assembly' },
  ];
  for (const r of records) {
    insertRecord.run(uuidv4(), r.eqId, r.name, r.bid, r.bd, r.dd, null, r.status, r.notes);
  }

  console.log('[DB] Seed data inserted successfully.');
}

// ─── Init (called once at server startup) ─────────────────────────────────────

let _db: SqlJsDatabase | null = null;

export async function initDatabase(): Promise<void> {
  if (_db) return;

  const SQL = await initSqlJs();

  const dbPath = path.resolve(process.env.DB_PATH ?? './labtrack.db');
  let inner: Database;

  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    inner = new SQL.Database(buf);
    console.log('[DB] Loaded existing database from', dbPath);
  } else {
    inner = new SQL.Database();
    console.log('[DB] Creating new database at', dbPath);
  }

  _db = new SqlJsDatabase(inner, dbPath);

  // Run schema (no-op if tables already exist)
  _db.exec(SCHEMA);

  // Seed if fresh
  seedIfEmpty(_db);

  // Persist the initial state
  _db.exec('SELECT 1'); // triggers persist via exec (even for empty statement)
}

/** Returns the shared DB instance. Throws if initDatabase() was not called. */
export function getDb(): SqlJsDatabase {
  if (!_db) throw new Error('[DB] Not initialised — call initDatabase() first.');
  return _db;
}

// Default export proxy with generics preserved
const dbProxy = {
  prepare<P = any[], R = any>(sql: string): PreparedStatement<P, R> {
    return getDb().prepare<P, R>(sql);
  },
  exec(sql: string) {
    return getDb().exec(sql);
  },
  pragma(statement: string) {
    return getDb().pragma(statement);
  },
};

export default dbProxy;
