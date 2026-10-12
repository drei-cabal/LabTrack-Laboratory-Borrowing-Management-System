export type EquipmentStatus = 'Available' | 'Partial' | 'Out';

export type BorrowStatus = 'borrowed' | 'overdue' | 'returned';

export interface EquipmentEntity {
  id: string;
  product_id?: string;
  name: string;
  brand?: string;
  model?: string;
  description: string;
  total_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface EquipmentWithDetails extends EquipmentEntity {
  borrowed_count: number;
  available_quantity: number;
  status: EquipmentStatus;
}

export interface BorrowRecordEntity {
  id: string;
  equipment_id: string;
  borrower_name: string;
  borrower_id: string;
  purpose?: string;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  status: BorrowStatus;
  notes?: string;
  authorized_by?: string;
  photo_proof?: string;
  quantity: number;
  transaction_code?: string;
  return_remarks?: string;
  created_at?: string;
}

export interface BorrowRecordWithEquipment extends BorrowRecordEntity {
  equipment_name: string;
  equipment_brand?: string;
  equipment_model?: string;
  equipment_product_id?: string;
}

export interface BorrowItemInput {
  equipment_id: string;
  quantity: number;
}

export interface CreateBorrowTransactionPayload {
  borrower_name: string;
  borrower_id: string;
  purpose: string;
  items: BorrowItemInput[];
  loan_period_days: number;
  borrow_date?: string;
  due_date?: string;
  authorized_by?: string;
  photo_proof?: string;
  notes?: string;
}

export interface TransactionSummary {
  transaction_code: string;
  borrower_name: string;
  borrower_id: string;
  purpose?: string;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  status: BorrowStatus;
  authorized_by?: string;
  notes?: string;
  return_remarks?: string;
  photo_proof?: string;
  items_summary: string;
  total_items: number;
  items: BorrowRecordWithEquipment[];
}

export interface ReturnTransactionPayload {
  transaction_code?: string;
  record_ids?: string[];
  return_date?: string;
  return_remarks?: string;
}
