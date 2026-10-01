import { EquipmentEntity, BorrowRecordEntity } from './types';

export interface DatabaseDriver {
  init(): Promise<void>;
  getAllAsync<T = any>(query: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(query: string, params?: any[]): Promise<T | null>;
  runAsync(query: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
  execAsync(queries: string): Promise<void>;
}

// In-memory fallback driver for Web or environments without native SQLite WASM
export class MemoryDatabaseDriver implements DatabaseDriver {
  private equipments: EquipmentEntity[] = [];
  private records: BorrowRecordEntity[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.seedInitialData();
    this.initialized = true;
  }

  private seedInitialData() {
    this.equipments = [
      {
        id: 'eq-1',
        product_id: 'EQ-001',
        name: 'Digital Multimeter',
        brand: 'Fluke',
        model: '117 True RMS',
        description: 'Fluke 117 True RMS, auto-ranging',
        total_quantity: 5,
        created_at: new Date('2026-09-01').toISOString(),
        updated_at: new Date('2026-09-01').toISOString(),
      },
      {
        id: 'eq-2',
        product_id: 'EQ-002',
        name: 'Oscilloscope',
        brand: 'Rigol',
        model: 'DS1054Z',
        description: 'Rigol DS1054Z, 4-channel 50MHz',
        total_quantity: 2,
        created_at: new Date('2026-09-02').toISOString(),
        updated_at: new Date('2026-09-02').toISOString(),
      },
      {
        id: 'eq-3',
        product_id: 'EQ-003',
        name: 'Function Generator',
        brand: 'Rigol',
        model: 'DG1022Z',
        description: 'Rigol DG1022Z, 25MHz dual-channel',
        total_quantity: 3,
        created_at: new Date('2026-09-03').toISOString(),
        updated_at: new Date('2026-09-03').toISOString(),
      },
      {
        id: 'eq-4',
        product_id: 'EQ-004',
        name: 'Soldering Iron Station',
        brand: 'Hakko',
        model: 'FX-888D',
        description: 'Hakko FX-888D temperature-controlled',
        total_quantity: 4,
        created_at: new Date('2026-09-04').toISOString(),
        updated_at: new Date('2026-09-04').toISOString(),
      },
    ];

    this.records = [
      {
        id: 'rec-1',
        equipment_id: 'eq-1',
        borrower_name: 'Maria Santos',
        borrower_id: '2021-00123',
        borrow_date: '2026-09-08',
        due_date: '2026-09-10',
        status: 'overdue',
      },
      {
        id: 'rec-2',
        equipment_id: 'eq-1',
        borrower_name: 'Jose Reyes',
        borrower_id: '2022-00458',
        borrow_date: '2026-09-14',
        due_date: '2026-09-17',
        status: 'overdue',
      },
      {
        id: 'rec-3',
        equipment_id: 'eq-1',
        borrower_name: 'Ana Flores',
        borrower_id: '2023-00789',
        borrow_date: '2026-09-15',
        due_date: '2026-09-18',
        status: 'borrowed',
      },
      {
        id: 'rec-4',
        equipment_id: 'eq-2',
        borrower_name: 'Christian Diaz',
        borrower_id: '2020-00331',
        borrow_date: '2026-09-12',
        due_date: '2026-09-15',
        status: 'overdue',
      },
      {
        id: 'rec-5',
        equipment_id: 'eq-2',
        borrower_name: 'Bea Alonzo',
        borrower_id: '2022-00892',
        borrow_date: '2026-09-16',
        due_date: '2026-09-20',
        status: 'borrowed',
      },
      {
        id: 'rec-6',
        equipment_id: 'eq-3',
        borrower_name: 'Carlos Yulo',
        borrower_id: '2023-01004',
        borrow_date: '2026-09-17',
        due_date: '2026-09-21',
        status: 'borrowed',
      },
      {
        id: 'rec-7',
        equipment_id: 'eq-4',
        borrower_name: 'Kim Chiu',
        borrower_id: '2021-00674',
        borrow_date: '2026-09-18',
        due_date: '2026-09-22',
        status: 'borrowed',
      },
    ];
  }

  async execAsync(queries: string): Promise<void> {
    // No-op for memory driver
  }

  async getAllAsync<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const q = query.toLowerCase().trim();
    if (q.includes('from equipment') && q.includes('where id =')) {
      const id = params[0];
      return this.equipments.filter((e) => e.id === id) as unknown as T[];
    }
    if (q.includes('from equipment')) {
      return [...this.equipments] as unknown as T[];
    }
    if (q.includes('from borrow_records') && q.includes('where equipment_id =')) {
      const eqId = params[0];
      return this.records.filter((r) => r.equipment_id === eqId) as unknown as T[];
    }
    if (q.includes('from borrow_records')) {
      return [...this.records] as unknown as T[];
    }
    return [] as T[];
  }

  async getFirstAsync<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const results = await this.getAllAsync<T>(query, params);
    return results[0] ?? null;
  }

  async runAsync(query: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    const q = query.toLowerCase().trim();
    if (q.startsWith('insert into equipment')) {
      // params: [id, product_id, name, brand, model, description, total_quantity, created_at, updated_at]
      const [id, product_id, name, brand, model, description, total_quantity, created_at, updated_at] = params;
      this.equipments.unshift({
        id,
        product_id: product_id || `EQ-${Date.now().toString().slice(-4)}`,
        name,
        brand: brand || '',
        model: model || '',
        description: description || '',
        total_quantity: Number(total_quantity) || 1,
        created_at: created_at || new Date().toISOString(),
        updated_at: updated_at || new Date().toISOString(),
      });
      return { changes: 1, lastInsertRowId: this.equipments.length };
    }
    if (q.startsWith('update equipment')) {
      // params: [product_id, name, brand, model, description, total_quantity, updated_at, id]
      const [product_id, name, brand, model, description, total_quantity, updated_at, id] = params;
      const idx = this.equipments.findIndex((e) => e.id === id);
      if (idx !== -1) {
        this.equipments[idx] = {
          ...this.equipments[idx],
          product_id: product_id || this.equipments[idx].product_id,
          name,
          brand: brand || '',
          model: model || '',
          description: description || '',
          total_quantity: Number(total_quantity),
          updated_at: updated_at || new Date().toISOString(),
        };
        return { changes: 1, lastInsertRowId: idx + 1 };
      }
      return { changes: 0, lastInsertRowId: 0 };
    }
    if (q.startsWith('delete from equipment')) {
      const id = params[0];
      const initialLen = this.equipments.length;
      this.equipments = this.equipments.filter((e) => e.id !== id);
      this.records = this.records.filter((r) => r.equipment_id !== id);
      return { changes: initialLen - this.equipments.length, lastInsertRowId: 0 };
    }
    if (q.startsWith('insert into borrow_records')) {
      const [id, equipment_id, borrower_name, borrower_id, borrow_date, due_date, status, notes] = params;
      this.records.unshift({
        id,
        equipment_id,
        borrower_name,
        borrower_id,
        borrow_date,
        due_date,
        status,
        notes,
      });
      return { changes: 1, lastInsertRowId: this.records.length };
    }
    return { changes: 0, lastInsertRowId: 0 };
  }
}
