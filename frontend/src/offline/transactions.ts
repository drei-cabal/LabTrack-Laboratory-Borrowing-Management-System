import { randomUUID } from 'expo-crypto';
import type { BorrowRecordWithEquipment, DashboardData, TransactionSummary } from '../types';
import { getLocalDatabase } from './database';
import { findEquipment, getEquipment } from './inventory';
import { dateOnly, LocalError, optionalText, positiveInteger, text, validDate } from './validation';

export function getBorrowRecords(): BorrowRecordWithEquipment[] {
  const db = getLocalDatabase();
  db.runSync("UPDATE borrow_records SET status='overdue' WHERE status='borrowed' AND due_date<?", dateOnly());
  return db.getAllSync<BorrowRecordWithEquipment>(`
    SELECT br.*,e.name AS equipment_name,e.brand AS equipment_brand,e.model AS equipment_model,e.product_id AS equipment_product_id
    FROM borrow_records br JOIN equipment e ON br.equipment_id=e.id
    ORDER BY br.borrow_date DESC,br.created_at DESC,br.id
  `);
}

export function getTransactions(): TransactionSummary[] {
  const groups = new Map<string, BorrowRecordWithEquipment[]>();
  for (const item of getBorrowRecords()) {
    const code = item.transaction_code || item.id;
    const group = groups.get(code) || [];
    group.push(item);
    groups.set(code, group);
  }
  return Array.from(groups, ([code, items]) => {
    const first = items[0];
    const status = items.some(item => item.status === 'overdue') ? 'overdue'
      : items.some(item => item.status === 'borrowed') ? 'borrowed' : 'returned';
    return {
      transaction_code: code, borrower_name: first.borrower_name, borrower_id: first.borrower_id,
      purpose: first.purpose, borrow_date: first.borrow_date, due_date: first.due_date,
      return_date: status === 'returned' ? items.map(item => item.return_date || '').sort().at(-1) : null,
      status, authorized_by: first.authorized_by, notes: first.notes, photo_proof: first.photo_proof,
      return_remarks: first.return_remarks,
      items_summary: `${first.equipment_name} x${first.quantity}${items.length > 1 ? ` +${items.length - 1} more` : ''}`,
      total_items: items.reduce((sum, item) => sum + item.quantity, 0), items,
    };
  });
}

export function findTransaction(code: string): TransactionSummary {
  const transaction = getTransactions().find(item => item.transaction_code === code || item.items.some(record => record.id === code));
  if (!transaction) throw new LocalError('Transaction not found.', 404);
  return transaction;
}

export function createTransaction(body: Record<string, unknown>, authorizedBy: string): BorrowRecordWithEquipment[] {
  const name = text(body.borrower_name, 'Borrower name');
  const borrowerId = text(body.borrower_id, 'Borrower ID');
  const purpose = text(body.purpose, 'Purpose');
  const borrowDate = validDate(body.borrow_date || dateOnly(), 'Borrow date');
  const days = positiveInteger(body.loan_period_days ?? 3, 'Loan duration');
  const defaultDue = new Date(Date.parse(`${borrowDate}T12:00:00Z`) + days * 86400000);
  const dueDate = validDate(body.due_date || defaultDue.toISOString().slice(0, 10), 'Due date');
  if (dueDate < borrowDate) throw new LocalError('Due date cannot be before the borrow date.');
  if (!Array.isArray(body.items) || !body.items.length) throw new LocalError('Select at least one equipment item.');
  const requested = new Map<string, number>();
  for (const item of body.items) {
    if (!item || typeof item !== 'object') throw new LocalError('Invalid equipment item.');
    const id = text(item.equipment_id, 'Equipment ID');
    requested.set(id, (requested.get(id) || 0) + positiveInteger(item.quantity, 'Quantity'));
  }
  const db = getLocalDatabase();
  let code = '';
  db.withTransactionSync(() => {
    for (const [id, quantity] of requested) {
      const equipment = findEquipment(id);
      if (quantity > equipment.available_quantity) throw new LocalError(`Only ${equipment.available_quantity} unit(s) of ${equipment.name} are available.`);
    }
    const prefix = `TXN-${new Date().getFullYear()}-`;
    const codes = db.getAllSync<{ transaction_code: string }>('SELECT DISTINCT transaction_code FROM borrow_records WHERE transaction_code LIKE ?', `${prefix}%`);
    const next = 1 + Math.max(0, ...codes.map(item => Number(item.transaction_code.slice(prefix.length)) || 0));
    code = `${prefix}${String(next).padStart(3, '0')}`;
    for (const [id, quantity] of requested) {
      db.runSync('INSERT INTO borrow_records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', randomUUID(), code, id, name, borrowerId, purpose, borrowDate, dueDate, null,
        dueDate < dateOnly() ? 'overdue' : 'borrowed', optionalText(body.notes), optionalText(body.authorized_by) || authorizedBy,
        optionalText(body.photo_proof) || null, quantity, null, new Date().toISOString());
    }
  });
  return findTransaction(code).items;
}

export function returnItems(body: Record<string, unknown>) {
  const records = getBorrowRecords();
  let selected: BorrowRecordWithEquipment[];
  const code = optionalText(body.transaction_code);
  if (body.record_ids !== undefined) {
    if (!Array.isArray(body.record_ids) || !body.record_ids.length) throw new LocalError('Select at least one item to return.');
    const ids = new Set(body.record_ids.map(id => text(id, 'Record ID')));
    selected = records.filter(item => ids.has(item.id));
    if (selected.length !== ids.size) throw new LocalError('One or more selected records do not exist.', 404);
    if (code && selected.some(item => item.transaction_code !== code)) throw new LocalError('Selected records do not belong to this transaction.');
  } else {
    if (!code) throw new LocalError('Select a transaction to return.');
    selected = findTransaction(code).items;
  }
  if (new Set(selected.map(item => item.transaction_code)).size !== 1) throw new LocalError('Return items from one transaction at a time.');
  const returnDate = validDate(body.return_date || dateOnly(), 'Return date');
  if (selected.some(item => returnDate < item.borrow_date)) throw new LocalError('Return date cannot be before the borrow date.');
  const db = getLocalDatabase();
  const active = selected.filter(item => item.status !== 'returned');
  db.withTransactionSync(() => {
    for (const item of active) {
      db.runSync("UPDATE borrow_records SET status='returned',return_date=?,return_remarks=? WHERE id=?", returnDate, optionalText(body.return_remarks), item.id);
    }
  });
  const transaction = findTransaction(selected[0].transaction_code!);
  return { returned_records: transaction.items.filter(item => active.some(record => record.id === item.id)), transaction };
}

export function getDashboard(): DashboardData {
  const transactions = getTransactions();
  const overdue = transactions.filter(item => item.status === 'overdue');
  const title = (item: TransactionSummary) => `${item.items[0].equipment_name}${item.items.length > 1 ? ` +${item.items.length - 1}` : ''}`;
  return {
    stats: { total_equipment: getEquipment().length, total_borrowed: transactions.filter(item => item.status === 'borrowed').length, total_overdue: overdue.length },
    overdue_items: overdue.map(item => {
      const days = Math.max(1, Math.round((Date.parse(dateOnly()) - Date.parse(item.due_date)) / 86400000));
      return { id: item.transaction_code, transaction_code: item.transaction_code, title: title(item), borrower_name: item.borrower_name, due_date: item.due_date, days_late: days, days_late_label: `${days}d late` };
    }),
    recent_transactions: transactions.slice(0, 10).map(item => ({ id: item.transaction_code, transaction_code: item.transaction_code,
      title: title(item), borrower_name: item.borrower_name, status: item.status, borrow_date: item.borrow_date, due_date: item.due_date })),
  };
}
