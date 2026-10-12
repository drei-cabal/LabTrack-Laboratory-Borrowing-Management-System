import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import {
  BorrowRecordEntity,
  BorrowRecordWithEquipment,
  CreateBorrowTransactionPayload,
  TransactionSummary,
  ReturnTransactionPayload,
} from '../types';

interface BorrowRecordRow {
  id: string;
  transaction_code: string | null;
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
  return_remarks: string | null;
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
    transaction_code: row.transaction_code ?? undefined,
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
    return_remarks: row.return_remarks ?? undefined,
    created_at: row.created_at ?? undefined,
    equipment_name: row.equipment_name,
    equipment_brand: row.equipment_brand ?? undefined,
    equipment_model: row.equipment_model ?? undefined,
    equipment_product_id: row.equipment_product_id ?? undefined,
  };
}

/**
 * Automatically update borrowed records to 'overdue' if due_date is in the past.
 */
function autoUpdateOverdueStatus(): void {
  try {
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      UPDATE borrow_records
      SET status = 'overdue'
      WHERE status = 'borrowed' AND due_date < ?
    `).run(today);
  } catch {
    // Ignore if database is locked or error
  }
}

/**
 * Generate a sequential transaction code like TXN-2026-088.
 */
function generateTransactionCode(): string {
  const year = new Date().getFullYear();
  const prefix = `TXN-${year}-`;
  try {
    const rows = db.prepare<[string], { transaction_code: string }>(`
      SELECT transaction_code
      FROM borrow_records
      WHERE transaction_code LIKE ?
      ORDER BY transaction_code DESC
    `).all(`${prefix}%`);

    let maxNum = 87; // default seed max
    for (const r of rows) {
      if (r.transaction_code) {
        const numPart = parseInt(r.transaction_code.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  } catch {
    return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
  }
}

/**
 * Returns all borrow records joined with equipment metadata.
 * Supports status filter ('all', 'borrowed', 'overdue', 'returned').
 */
export function getAll(statusFilter?: string): BorrowRecordWithEquipment[] {
  autoUpdateOverdueStatus();

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
  autoUpdateOverdueStatus();

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
 * Returns all transactions grouped by transaction_code matching Figma Records screen.
 */
export function getTransactions(statusFilter?: string, search?: string): TransactionSummary[] {
  autoUpdateOverdueStatus();

  const query = `
    SELECT
      br.*,
      e.name AS equipment_name,
      e.brand AS equipment_brand,
      e.model AS equipment_model,
      e.product_id AS equipment_product_id
    FROM borrow_records br
    JOIN equipment e ON e.id = br.equipment_id
    ORDER BY br.borrow_date DESC, br.created_at DESC
  `;

  const rows = db.prepare<[], BorrowRecordWithEquipmentRow>(query).all();
  const allMapped = rows.map(mapRow);

  // Group by transaction_code (or fallback to record id if missing)
  const groupMap = new Map<string, BorrowRecordWithEquipment[]>();
  for (const item of allMapped) {
    const code = item.transaction_code || item.id;
    const existing = groupMap.get(code) || [];
    existing.push(item);
    groupMap.set(code, existing);
  }

  const summaries: TransactionSummary[] = [];

  for (const [code, items] of groupMap.entries()) {
    const first = items[0];

    // Determine overall status
    let status: BorrowRecordEntity['status'] = 'returned';
    if (items.some((i) => i.status === 'overdue')) {
      status = 'overdue';
    } else if (items.some((i) => i.status === 'borrowed')) {
      status = 'borrowed';
    }

    // Build items summary string (e.g. "Digital Multimeter ×2 +1 more")
    let items_summary = `${first.equipment_name} ×${first.quantity}`;
    if (items.length > 1) {
      items_summary += ` +${items.length - 1} more`;
    }

    const total_items = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

    const summary: TransactionSummary = {
      transaction_code: first.transaction_code || code,
      borrower_name: first.borrower_name,
      borrower_id: first.borrower_id,
      purpose: first.purpose,
      borrow_date: first.borrow_date,
      due_date: first.due_date,
      return_date: first.return_date,
      status,
      authorized_by: first.authorized_by,
      notes: first.notes,
      return_remarks: first.return_remarks,
      photo_proof: first.photo_proof,
      items_summary,
      total_items,
      items,
    };

    // Filter by status if requested
    if (statusFilter && statusFilter !== 'all') {
      if (summary.status !== statusFilter) {
        continue;
      }
    }

    // Filter by search query if requested
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const matchesBorrower = summary.borrower_name.toLowerCase().includes(q);
      const matchesId = summary.borrower_id.toLowerCase().includes(q);
      const matchesCode = summary.transaction_code.toLowerCase().includes(q);
      const matchesItems = items.some((i) => i.equipment_name.toLowerCase().includes(q));

      if (!matchesBorrower && !matchesId && !matchesCode && !matchesItems) {
        continue;
      }
    }

    summaries.push(summary);
  }

  return summaries;
}

/**
 * Returns a single transaction by its code (or record ID) with all items.
 */
export function getTransactionByCode(code: string): TransactionSummary | null {
  autoUpdateOverdueStatus();

  const query = `
    SELECT
      br.*,
      e.name AS equipment_name,
      e.brand AS equipment_brand,
      e.model AS equipment_model,
      e.product_id AS equipment_product_id
    FROM borrow_records br
    JOIN equipment e ON e.id = br.equipment_id
    WHERE br.transaction_code = ? OR br.id = ?
    ORDER BY br.created_at ASC
  `;

  const rows = db.prepare<[string, string], BorrowRecordWithEquipmentRow>(query).all(code, code);
  if (!rows.length) return null;

  const items = rows.map(mapRow);
  const first = items[0];

  let status: BorrowRecordEntity['status'] = 'returned';
  if (items.some((i) => i.status === 'overdue')) {
    status = 'overdue';
  } else if (items.some((i) => i.status === 'borrowed')) {
    status = 'borrowed';
  }

  let items_summary = `${first.equipment_name} ×${first.quantity}`;
  if (items.length > 1) {
    items_summary += ` +${items.length - 1} more`;
  }

  const total_items = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  return {
    transaction_code: first.transaction_code || code,
    borrower_name: first.borrower_name,
    borrower_id: first.borrower_id,
    purpose: first.purpose,
    borrow_date: first.borrow_date,
    due_date: first.due_date,
    return_date: first.return_date,
    status,
    authorized_by: first.authorized_by,
    notes: first.notes,
    return_remarks: first.return_remarks,
    photo_proof: first.photo_proof,
    items_summary,
    total_items,
    items,
  };
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

  // 2. Generate a unified transaction code for this transaction
  const transactionCode = generateTransactionCode();

  // 3. Insert records
  const insertStmt = db.prepare(`
    INSERT INTO borrow_records (
      id,
      transaction_code,
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
      return_remarks,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdIds: string[] = [];
  const createdAt = now.toISOString();

  for (const item of payload.items) {
    const recordId = uuidv4();
    insertStmt.run(
      recordId,
      transactionCode,
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
      null,
      createdAt
    );
    createdIds.push(recordId);
  }

  // 4. Return created records with equipment info
  return createdIds.map((id) => getById(id)!);
}

/**
 * Returns a borrow record (marks returned).
 */
export function returnRecord(id: string, returnDate?: string, remarks?: string): BorrowRecordWithEquipment | null {
  const existing = getById(id);
  if (!existing) return null;

  const resolvedReturnDate = returnDate || new Date().toISOString().split('T')[0];

  db.prepare(`
    UPDATE borrow_records
    SET status = 'returned', return_date = ?, return_remarks = COALESCE(?, return_remarks)
    WHERE id = ?
  `).run(resolvedReturnDate, remarks ?? null, id);

  return getById(id);
}

/**
 * Processes a return for a transaction or selected items in a transaction.
 */
export function processReturn(payload: ReturnTransactionPayload): {
  returned_records: BorrowRecordWithEquipment[];
  transaction: TransactionSummary | null;
} {
  const returnDate = payload.return_date || new Date().toISOString().split('T')[0];
  const remarks = payload.return_remarks || 'All units returned in good working condition.';

  let targetRecords: BorrowRecordWithEquipment[] = [];

  if (payload.record_ids && payload.record_ids.length > 0) {
    for (const rid of payload.record_ids) {
      const rec = getById(rid);
      if (rec && rec.status !== 'returned') {
        targetRecords.push(rec);
      }
    }
  } else if (payload.transaction_code) {
    const tx = getTransactionByCode(payload.transaction_code);
    if (tx) {
      targetRecords = tx.items.filter((i) => i.status !== 'returned');
    }
  }

  if (targetRecords.length === 0) {
    throw new Error('No active items found to return.');
  }

  const updateStmt = db.prepare(`
    UPDATE borrow_records
    SET status = 'returned', return_date = ?, return_remarks = ?
    WHERE id = ?
  `);

  const returnedList: BorrowRecordWithEquipment[] = [];
  for (const item of targetRecords) {
    updateStmt.run(returnDate, remarks, item.id);
    const updated = getById(item.id);
    if (updated) returnedList.push(updated);
  }

  const transactionCode = targetRecords[0].transaction_code || payload.transaction_code;
  const updatedTx = transactionCode ? getTransactionByCode(transactionCode) : null;

  return {
    returned_records: returnedList,
    transaction: updatedTx,
  };
}
