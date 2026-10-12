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
    transaction_code TEXT,
    equipment_id TEXT NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_id TEXT NOT NULL,
    purpose TEXT,
    borrow_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    return_date TEXT,
    status TEXT NOT NULL DEFAULT 'borrowed',
    notes TEXT,
    authorized_by TEXT,
    photo_proof TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    return_remarks TEXT,
    created_at TEXT,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
  );
`;

function migrateSchema(db: SqlJsDatabase): void {
  const columnsToAdd = [
    'ALTER TABLE borrow_records ADD COLUMN transaction_code TEXT',
    'ALTER TABLE borrow_records ADD COLUMN purpose TEXT',
    'ALTER TABLE borrow_records ADD COLUMN authorized_by TEXT',
    'ALTER TABLE borrow_records ADD COLUMN photo_proof TEXT',
    'ALTER TABLE borrow_records ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1',
    'ALTER TABLE borrow_records ADD COLUMN return_remarks TEXT',
    'ALTER TABLE borrow_records ADD COLUMN created_at TEXT',
  ];

  for (const sql of columnsToAdd) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists, safe to ignore
    }
  }

  // Backfill any missing transaction_code on existing rows
  try {
    const unassigned = db.prepare<[], { id: string; borrower_name: string }>(
      "SELECT id, borrower_name FROM borrow_records WHERE transaction_code IS NULL OR transaction_code = ''"
    ).all();

    if (unassigned.length > 0) {
      let counter = 80;
      for (const row of unassigned) {
        db.prepare("UPDATE borrow_records SET transaction_code = ? WHERE id = ?").run(
          `TXN-2026-0${counter++}`,
          row.id
        );
      }
    }
  } catch {
    // Ignore migration backfill errors
  }
}

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
  const eq5Id = uuidv4(); const eq6Id = uuidv4();

  const equipmentToSeed = [
    { id: eq1Id, pid: 'EQ-001', name: 'Digital Multimeter',    brand: 'Fluke',   model: '117 True RMS', desc: 'Digital multimeter for electrical measurements', qty: 5 },
    { id: eq2Id, pid: 'EQ-002', name: 'Oscilloscope',           brand: 'Rigol',   model: 'DS1054Z',      desc: 'Digital oscilloscope with 4 channels',          qty: 2 },
    { id: eq3Id, pid: 'EQ-003', name: 'Function Generator',     brand: 'Rigol',   model: 'DG1022Z',      desc: 'Arbitrary waveform function generator',          qty: 3 },
    { id: eq4Id, pid: 'EQ-004', name: 'Soldering Iron Station', brand: 'Hakko',   model: 'FX-888D',      desc: 'Temperature-controlled soldering station',       qty: 4 },
    { id: eq5Id, pid: 'EQ-005', name: 'Logic Analyzer',         brand: 'Saleae',  model: 'Logic 8',      desc: '8-channel USB logic analyzer',                  qty: 3 },
    { id: eq6Id, pid: 'EQ-006', name: 'Breadboard Set',         brand: 'Elegoo',  model: 'MB-102',       desc: 'Solderless breadboards with jumper wires',       qty: 10 },
  ];
  for (const eq of equipmentToSeed) {
    insertEquipment.run(eq.id, eq.pid, eq.name, eq.brand, eq.model, eq.desc, eq.qty, now, now);
  }

  // Borrow records
  const insertRecord = db.prepare(
    `INSERT INTO borrow_records (
      id, transaction_code, equipment_id, borrower_name, borrower_id, purpose,
      borrow_date, due_date, return_date, status, notes, authorized_by, photo_proof, quantity, return_remarks, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const daysAgo  = (n: number) => fmt(new Date(Date.now() - n * 86_400_000));
  const daysFrom = (n: number) => fmt(new Date(Date.now() + n * 86_400_000));

  const seedTransactions = [
    {
      code: 'TXN-2026-087',
      name: 'Maria Santos',
      bid: '2021-00002',
      purpose: 'EE301 Circuit Analysis Lab',
      bd: daysAgo(5),
      dd: daysAgo(2),
      rd: null,
      status: 'overdue',
      auth: 'Admin Cruz',
      remarks: null,
      items: [
        { eqId: eq1Id, qty: 2 },
        { eqId: eq2Id, qty: 1 },
      ],
    },
    {
      code: 'TXN-2026-086',
      name: 'Jose Reyes',
      bid: '2021-00003',
      purpose: 'Signal Processing Experiment',
      bd: daysAgo(4),
      dd: daysAgo(1),
      rd: null,
      status: 'overdue',
      auth: 'Admin Cruz',
      remarks: null,
      items: [
        { eqId: eq3Id, qty: 1 },
        { eqId: eq1Id, qty: 1 },
      ],
    },
    {
      code: 'TXN-2026-085',
      name: 'Ana Flores',
      bid: '2021-00004',
      purpose: 'Robotics Club Workshop',
      bd: daysAgo(2),
      dd: daysFrom(3),
      rd: null,
      status: 'borrowed',
      auth: 'Admin Cruz',
      remarks: null,
      items: [
        { eqId: eq1Id, qty: 1 },
        { eqId: eq4Id, qty: 1 },
      ],
    },
    {
      code: 'TXN-2026-084',
      name: 'Carlos Mendoza',
      bid: '2021-00005',
      purpose: 'Capstone Hardware Prototyping',
      bd: daysAgo(1),
      dd: daysFrom(5),
      rd: null,
      status: 'borrowed',
      auth: 'Admin Cruz',
      remarks: null,
      items: [
        { eqId: eq4Id, qty: 2 },
        { eqId: eq1Id, qty: 1 },
      ],
    },
    {
      code: 'TXN-2026-083',
      name: 'Lea Bautista',
      bid: '2822-08654',
      purpose: 'EE410 Advanced Lab — Digital Logic',
      bd: daysAgo(12),
      dd: daysAgo(7),
      rd: daysAgo(8),
      status: 'returned',
      auth: 'Asst. Dela Cruz',
      remarks: 'All items returned in good condition.',
      items: [
        { eqId: eq5Id, qty: 1 },
        { eqId: eq6Id, qty: 2 },
      ],
    },
  ];

  for (const t of seedTransactions) {
    for (const item of t.items) {
      insertRecord.run(
        uuidv4(),
        t.code,
        item.eqId,
        t.name,
        t.bid,
        t.purpose,
        t.bd,
        t.dd,
        t.rd,
        t.status,
        t.purpose,
        t.auth,
        null,
        item.qty,
        t.remarks,
        now
      );
    }
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

  // Apply column migrations if database already existed
  migrateSchema(_db);

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
