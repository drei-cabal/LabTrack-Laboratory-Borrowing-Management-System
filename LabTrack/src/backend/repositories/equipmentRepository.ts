import { getDatabase } from '../database';
import { EquipmentEntity, EquipmentWithDetails, EquipmentStatus, BorrowRecordEntity } from '../types';

export class EquipmentRepository {
  async getAll(): Promise<EquipmentWithDetails[]> {
    const db = await getDatabase();
    const equipments = await db.getAllAsync<EquipmentEntity>(
      'SELECT * FROM equipment ORDER BY created_at DESC;'
    );
    const records = await db.getAllAsync<{ equipment_id: string; status: string }>(
      'SELECT equipment_id, status FROM borrow_records WHERE status IN (\'borrowed\', \'overdue\');'
    );

    // Count active borrowed items per equipment
    const borrowedCountMap = new Map<string, number>();
    for (const rec of records) {
      borrowedCountMap.set(rec.equipment_id, (borrowedCountMap.get(rec.equipment_id) || 0) + 1);
    }

    return equipments.map((eq) => {
      const borrowed_count = borrowedCountMap.get(eq.id) || 0;
      const available_quantity = Math.max(0, eq.total_quantity - borrowed_count);
      
      let status: EquipmentStatus = 'Available';
      if (available_quantity === 0) {
        status = 'Out';
      } else if (borrowed_count > 0) {
        status = 'Partial';
      } else {
        status = 'Available';
      }

      return {
        ...eq,
        borrowed_count,
        available_quantity,
        status,
      };
    });
  }

  async getById(id: string): Promise<EquipmentWithDetails | null> {
    const db = await getDatabase();
    const eq = await db.getFirstAsync<EquipmentEntity>(
      'SELECT * FROM equipment WHERE id = ?;',
      [id]
    );

    if (!eq) return null;

    const records = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM borrow_records WHERE equipment_id = ? AND status IN (\'borrowed\', \'overdue\');',
      [id]
    );

    const borrowed_count = records.length;
    const available_quantity = Math.max(0, eq.total_quantity - borrowed_count);

    let status: EquipmentStatus = 'Available';
    if (available_quantity === 0) {
      status = 'Out';
    } else if (borrowed_count > 0) {
      status = 'Partial';
    } else {
      status = 'Available';
    }

    return {
      ...eq,
      borrowed_count,
      available_quantity,
      status,
    };
  }

  async getActiveRecords(equipmentId: string): Promise<BorrowRecordEntity[]> {
    const db = await getDatabase();
    return db.getAllAsync<BorrowRecordEntity>(
      'SELECT * FROM borrow_records WHERE equipment_id = ? AND status IN (\'borrowed\', \'overdue\') ORDER BY due_date ASC;',
      [equipmentId]
    );
  }

  async create(data: {
    product_id?: string;
    name: string;
    brand?: string;
    model?: string;
    description: string;
    total_quantity: number;
  }): Promise<EquipmentEntity> {
    const db = await getDatabase();
    const id = 'eq-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const product_id = data.product_id?.trim() || `EQ-${Date.now().toString().slice(-4)}`;
    const brand = data.brand?.trim() || '';
    const model = data.model?.trim() || '';
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO equipment (id, product_id, name, brand, model, description, total_quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [id, product_id, data.name, brand, model, data.description, data.total_quantity, now, now]
    );

    return {
      id,
      product_id,
      name: data.name,
      brand,
      model,
      description: data.description,
      total_quantity: data.total_quantity,
      created_at: now,
      updated_at: now,
    };
  }

  async update(
    id: string,
    data: {
      product_id?: string;
      name: string;
      brand?: string;
      model?: string;
      description: string;
      total_quantity: number;
    }
  ): Promise<boolean> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const product_id = data.product_id?.trim() || '';
    const brand = data.brand?.trim() || '';
    const model = data.model?.trim() || '';

    const result = await db.runAsync(
      'UPDATE equipment SET product_id = ?, name = ?, brand = ?, model = ?, description = ?, total_quantity = ?, updated_at = ? WHERE id = ?;',
      [product_id, data.name, brand, model, data.description, data.total_quantity, now, id]
    );

    return result.changes > 0;
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync('DELETE FROM equipment WHERE id = ?;', [id]);
    return result.changes > 0;
  }
}

export const equipmentRepository = new EquipmentRepository();
