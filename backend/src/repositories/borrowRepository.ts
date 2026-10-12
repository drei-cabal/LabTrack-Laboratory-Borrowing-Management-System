import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import {
  BorrowRecordEntity,
  BorrowRecordWithEquipment,
  CreateBorrowTransactionPayload,
  BorrowItemInput,
} from '../types';

interface BorrowRecordRow {
  id: string;
  equipment_id: string;
  borrower_name: string;
  borrower_id: string;
  purpose: string | null;
  borrow_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  notes: string | null;
  authorized_by: string | null;
  photo_proof: string | null;
  quantity: number | null;
  created_at: string | null;
}

interface BorrowRecordWithEquipmentRow extends BorrowRecordRow {
  equipment_name: string;
  equipment_brand: string | null;
  equipment_model: string | null;
  equipment_product_id: string | null;
}

function mapRow(row: BorrowRecordWithEquipmentRow): BorrowRecordWithEquipment {
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
    created_at: row.created_at ?? undefined,
    equipment_name: row.equipment_name,
    equipment_brand: row.equipment_brand ?? undefined,
    equipment_model: row.equipment_model ?? undefined,
    equipment_product_id: row.equipment_product_id ?? undefined,
  };
}

/**
 * Returns all borrow records joined with equipment metadata.
 * Supports status filter ('all', 'borrowed', 'overdue', 'returned').
 */
export function getAll(statusFilter?: string): BorrowRecordWithEquipment[] {
  let query = `
    SELECT
      br.*,
      e.name AS equipment_name,
      e.brand AS equipment_brand,
      e.model AS equipment_model,
      e.product_id AS equipment_product_id
    FROM borrow_records br
    JOIN equipment e ON e.id = br.equipment_id
  `;

  if (statusFilter && statusFilter !== 'all') {
    query += ` WHERE br.status = ? ORDER BY br.borrow_date DESC, br.created_at DESC`;
    const rows = db.prepare<[string], BorrowRecordWithEquipmentRow>(query).all(statusFilter);
    return rows.map(mapRow);
  } else {
    query += ` ORDER BY br.borrow_date DESC, br.created_at DESC`;
    const rows = db.prepare<[], BorrowRecordWithEquipmentRow>(query).all();
    return rows.map(mapRow);
  }
}

/**
 * Returns a single borrow record by ID with equipment metadata.
 */
export function getById(id: string): BorrowRecordWithEquipment | null {
  const row = db.prepare<[string], BorrowRecordWithEquipmentRow>(`
    SELECT
      br.*,
      e.name AS equipment_name,
      e.brand AS equipment_brand,
      e.model AS equipment_model,
      e.product_id AS equipment_product_id
    FROM borrow_records br
    JOIN equipment e ON e.id = br.equipment_id
    WHERE br.id = ?
  `).get(id);

  return row ? mapRow(row) : null;
}

/**
 * Creates borrow records for multiple items in a single transaction.
 * Validates available stock for each item before inserting.
 */
export function createTransaction(payload: CreateBorrowTransactionPayload): BorrowRecordWithEquipment[] {
  const now = new Date();
  const todayStr = payload.borrow_date || now.toISOString().split('T')[0];

  let dueDateStr = payload.due_date;
  if (!dueDateStr) {
    const loanDays = Math.max(1, payload.loan_period_days || 3);
    const dueDate = new Date(now.getTime() + loanDays * 86_400_000);
    dueDateStr = dueDate.toISOString().split('T')[0];
  }

  // 1. Validate that all equipment exists and has sufficient available quantity
  for (const item of payload.items) {
    const eqRow = db.prepare<[string], { id: string; name: string; total_quantity: number; borrowed_count: number }>(`
      SELECT
        e.id,
        e.name,
        e.total_quantity,
        COALESCE((
          SELECT SUM(COALESCE(br.quantity, 1))
          FROM borrow_records br
          WHERE br.equipment_id = e.id
            AND br.status IN ('borrowed', 'overdue')
        ), 0) AS borrowed_count
      FROM equipment e
      WHERE e.id = ?
    `).get(item.equipment_id);

    if (!eqRow) {
      throw new Error(`Equipment with id ${item.equipment_id} not found.`);
    }

    const available = Math.max(0, eqRow.total_quantity - eqRow.borrowed_count);
    if (item.quantity > available) {
      throw new Error(
        `Insufficient quantity for "${eqRow.name}". Requested: ${item.quantity}, Available: ${available}`
      );
    }
  }

  // 2. Insert records
  const insertStmt = db.prepare(`
    INSERT INTO borrow_records (
      id,
      equipment_id,
      borrower_name,
      borrower_id,
      purpose,
      borrow_date,
      due_date,
      return_date,
      status,
      notes,
      authorized_by,
      photo_proof,
      quantity,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdIds: string[] = [];
  const createdAt = now.toISOString();

  for (const item of payload.items) {
    const recordId = uuidv4();
    insertStmt.run(
      recordId,
      item.equipment_id,
      payload.borrower_name.trim(),
      payload.borrower_id.trim(),
      payload.purpose.trim(),
      todayStr,
      dueDateStr,
      null,
      'borrowed',
      payload.notes ? payload.notes.trim() : null,
      payload.authorized_by ? payload.authorized_by.trim() : 'Admin Cruz',
      payload.photo_proof || null,
      Math.max(1, item.quantity),
      createdAt
    );
    createdIds.push(recordId);
  }

  // 3. Return created records with equipment info
  return createdIds.map((id) => getById(id)!);
}

/**
 * Returns a borrow record (marks returned).
 */
export function returnRecord(id: string): BorrowRecordWithEquipment | null {
  const existing = getById(id);
  if (!existing) return null;

  const returnDate = new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE borrow_records
    SET status = 'returned', return_date = ?
    WHERE id = ?
  `).run(returnDate, id);

  return getById(id);
}
