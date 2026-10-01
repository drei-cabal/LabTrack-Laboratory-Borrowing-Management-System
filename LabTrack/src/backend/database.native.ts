import * as SQLite from 'expo-sqlite';
import { DatabaseDriver, MemoryDatabaseDriver } from './driver';

export * from './driver';

class NativeSQLiteDriver implements DatabaseDriver {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await SQLite.openDatabaseAsync('labtrack.db');

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS equipment (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        total_quantity INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS borrow_records (
        id TEXT PRIMARY KEY NOT NULL,
        equipment_id TEXT NOT NULL,
        borrower_name TEXT NOT NULL,
        borrower_id TEXT NOT NULL,
        borrow_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        return_date TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
      );
    `);

    const countResult = await this.db.getFirstAsync<{ count: number }>(
      'SELECT count(*) as count FROM equipment;'
    );

    if (countResult && countResult.count === 0) {
      await this.seedData();
    }
  }

  private async seedData(): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT INTO equipment (id, name, description, total_quantity, created_at, updated_at) VALUES
        ('eq-1', 'Digital Multimeter', 'Fluke 117 True RMS, auto-ranging', 5, '2026-09-01T00:00:00Z', '2026-09-01T00:00:00Z'),
        ('eq-2', 'Oscilloscope', 'Rigol DS1054Z, 4-channel 50MHz', 2, '2026-09-02T00:00:00Z', '2026-09-02T00:00:00Z'),
        ('eq-3', 'Function Generator', 'Rigol DG1022Z, 25MHz dual-channel', 3, '2026-09-03T00:00:00Z', '2026-09-03T00:00:00Z'),
        ('eq-4', 'Soldering Iron Station', 'Hakko FX-888D temperature-controlled', 4, '2026-09-04T00:00:00Z', '2026-09-04T00:00:00Z');`
    );

    await this.db.runAsync(
      `INSERT INTO borrow_records (id, equipment_id, borrower_name, borrower_id, borrow_date, due_date, status) VALUES
        ('rec-1', 'eq-1', 'Maria Santos', '2021-00123', '2026-09-08', '2026-09-10', 'overdue'),
        ('rec-2', 'eq-1', 'Jose Reyes', '2022-00458', '2026-09-14', '2026-09-17', 'overdue'),
        ('rec-3', 'eq-1', 'Ana Flores', '2023-00789', '2026-09-15', '2026-09-18', 'borrowed'),
        ('rec-4', 'eq-2', 'Christian Diaz', '2020-00331', '2026-09-12', '2026-09-15', 'overdue'),
        ('rec-5', 'eq-2', 'Bea Alonzo', '2022-00892', '2026-09-16', '2026-09-20', 'borrowed'),
        ('rec-6', 'eq-3', 'Carlos Yulo', '2023-01004', '2026-09-17', '2026-09-21', 'borrowed'),
        ('rec-7', 'eq-4', 'Kim Chiu', '2021-00674', '2026-09-18', '2026-09-22', 'borrowed');`
    );
  }

  async getAllAsync<T = any>(query: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllAsync<T>(query, params);
  }

  async getFirstAsync<T = any>(query: string, params: any[] = []): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getFirstAsync<T>(query, params);
  }

  async runAsync(query: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(query, params);
    return {
      changes: result.changes,
      lastInsertRowId: result.lastInsertRowId,
    };
  }

  async execAsync(queries: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.execAsync(queries);
  }
}

let dbInstance: DatabaseDriver | null = null;

export async function getDatabase(): Promise<DatabaseDriver> {
  if (dbInstance) return dbInstance;
  try {
    const nativeDriver = new NativeSQLiteDriver();
    await nativeDriver.init();
    dbInstance = nativeDriver;
  } catch (e) {
    console.warn('Native SQLite unavailable, falling back to memory driver', e);
    const memDriver = new MemoryDatabaseDriver();
    await memDriver.init();
    dbInstance = memDriver;
  }
  return dbInstance;
}
