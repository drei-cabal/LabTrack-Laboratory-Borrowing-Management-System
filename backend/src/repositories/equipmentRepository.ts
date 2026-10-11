import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import {
  EquipmentEntity,
  EquipmentWithDetails,
  BorrowRecordEntity,
  EquipmentStatus,
} from '../types';

// ─── Row shapes returned by SQLite ───────────────────────────────────────────

interface EquipmentRow {
  id: string;
  product_id: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  total_quantity: number;
  created_at: string;
  updated_at: string;
  borrowed_count: number;
}

interface BorrowRecordRow {
  id: string;
  equipment_id: string;
  borrower_name: string;
  borrower_id: string;
  purpose?: string | null;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  notes: string | null;
  authorized_by?: string | null;
  photo_proof?: string | null;
  quantity?: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStatus(borrowedCount: number, totalQuantity: number): EquipmentStatus {
  if (borrowedCount >= totalQuantity) return 'Out';
  if (borrowedCount > 0) return 'Partial';
  return 'Available';
}

function mapEquipmentRow(row: EquipmentRow): EquipmentWithDetails {
  const borrowed_count = row.borrowed_count ?? 0;
  const total_quantity = row.total_quantity;
  const available_quantity = Math.max(0, total_quantity - borrowed_count);
  const status = computeStatus(borrowed_count, total_quantity);

  return {
    id: row.id,
    product_id: row.product_id ?? undefined,
    name: row.name,
    brand: row.brand ?? undefined,
    model: row.model ?? undefined,
    description: row.description ?? '',
    total_quantity,
    created_at: row.created_at,
    updated_at: row.updated_at,
    borrowed_count,
    available_quantity,
    status,
  };
}

function mapBorrowRow(row: BorrowRecordRow): BorrowRecordEntity {
  return {
    id: row.id,
    equipment_id: row.equipment_id,
    borrower_name: row.borrower_name,
    borrower_id: row.borrower_id,
    purpose: row.purpose ?? undefined,
    borrow_date: row.borrow_date,
    due_date: row.due_date,
    return_date: row.return_date ?? undefined,
    status: row.status as BorrowRecordEntity['status'],
    notes: row.notes ?? undefined,
    authorized_by: row.authorized_by ?? undefined,
    photo_proof: row.photo_proof ?? undefined,
    quantity: row.quantity ?? 1,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * Retrieve all equipment with live borrow counts, availability, and status.
 */
export function getAll(): EquipmentWithDetails[] {
  const rows = db.prepare<[], EquipmentRow>(`
    SELECT
      e.*,
      COALESCE((
        SELECT SUM(COALESCE(br.quantity, 1))
        FROM borrow_records br
        WHERE br.equipment_id = e.id
          AND br.status IN ('borrowed', 'overdue')
      ), 0) AS borrowed_count
    FROM equipment e
    ORDER BY e.created_at DESC
  `).all();

  return rows.map(mapEquipmentRow);
}

/**
 * Retrieve a single equipment item by its UUID.
 */
export function getById(id: string): EquipmentWithDetails | null {
  const row = db.prepare<[string], EquipmentRow>(`
    SELECT
      e.*,
      COALESCE((
        SELECT SUM(COALESCE(br.quantity, 1))
        FROM borrow_records br
        WHERE br.equipment_id = e.id
          AND br.status IN ('borrowed', 'overdue')
      ), 0) AS borrowed_count
    FROM equipment e
    WHERE e.id = ?
  `).get(id);

  return row ? mapEquipmentRow(row) : null;
}

/**
 * Get active (borrowed / overdue) borrow records for a piece of equipment.
 */
export function getActiveRecords(equipmentId: string): BorrowRecordEntity[] {
  const rows = db.prepare<[string], BorrowRecordRow>(`
    SELECT * FROM borrow_records
    WHERE equipment_id = ?
      AND status IN ('borrowed', 'overdue')
    ORDER BY borrow_date DESC
  `).all(equipmentId);

  return rows.map(mapBorrowRow);
}

/**
 * Insert a new equipment record and return the created entity.
 */
export function create(data: Omit<EquipmentEntity, 'id' | 'created_at' | 'updated_at'>): EquipmentEntity {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO equipment (id, product_id, name, brand, model, description, total_quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.product_id ?? null,
    data.name,
    data.brand ?? null,
    data.model ?? null,
    data.description ?? '',
    data.total_quantity,
    now,
    now,
  );

  return { id, ...data, description: data.description ?? '', created_at: now, updated_at: now };
}

/**
 * Update an existing equipment record. Returns true if a row was modified.
 */
export function update(
  id: string,
  data: Partial<Omit<EquipmentEntity, 'id' | 'created_at' | 'updated_at'>>
): boolean {
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE equipment
    SET
      product_id    = COALESCE(?, product_id),
      name          = COALESCE(?, name),
      brand         = COALESCE(?, brand),
      model         = COALESCE(?, model),
      description   = COALESCE(?, description),
      total_quantity = COALESCE(?, total_quantity),
      updated_at    = ?
    WHERE id = ?
  `).run(
    data.product_id ?? null,
    data.name ?? null,
    data.brand ?? null,
    data.model ?? null,
    data.description ?? null,
    data.total_quantity ?? null,
    now,
    id,
  );

  return result.changes > 0;
}

/**
 * Delete an equipment record by id. Returns true if a row was deleted.
 */
export function deleteById(id: string): boolean {
  const result = db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
  return result.changes > 0;
}
