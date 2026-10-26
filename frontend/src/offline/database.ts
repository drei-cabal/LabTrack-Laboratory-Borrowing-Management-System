import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import initialData from './initialData.json';

let database: SQLiteDatabase | undefined;

export function getLocalDatabase(): SQLiteDatabase {
  if (database) return database;
  const db = openDatabaseSync('labtrack-offline.db');
  db.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  db.withTransactionSync(() => {
    const version = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')!.user_version;
    if (version > 1) throw new Error('This database requires a newer version of LabTrack.');
    if (version === 1) return;
    db.execSync(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','assistant')), full_name TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT '', is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
      CREATE TABLE sessions (
        token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      );
      CREATE TABLE equipment (
        id TEXT PRIMARY KEY, product_id TEXT, name TEXT NOT NULL, brand TEXT, model TEXT,
        description TEXT NOT NULL DEFAULT '', total_quantity INTEGER NOT NULL CHECK(total_quantity > 0),
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE borrow_records (
        id TEXT PRIMARY KEY, transaction_code TEXT NOT NULL,
        equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
        borrower_name TEXT NOT NULL, borrower_id TEXT NOT NULL, purpose TEXT,
        borrow_date TEXT NOT NULL, due_date TEXT NOT NULL, return_date TEXT,
        status TEXT NOT NULL CHECK(status IN ('borrowed','overdue','returned')),
        notes TEXT, authorized_by TEXT, photo_proof TEXT,
        quantity INTEGER NOT NULL CHECK(quantity > 0), return_remarks TEXT, created_at TEXT NOT NULL
      );
      CREATE INDEX records_equipment_status ON borrow_records(equipment_id,status);
      CREATE INDEX records_transaction ON borrow_records(transaction_code);
    `);
    for (const item of initialData.equipment) {
      db.runSync('INSERT INTO equipment VALUES (?,?,?,?,?,?,?,?,?)', item.id, item.product_id, item.name, item.brand, item.model, item.description, item.total_quantity, item.created_at, item.updated_at);
    }
    db.execSync('PRAGMA user_version = 1;');
  });
  database = db;
  return db;
}
