// ─── Equipment ───────────────────────────────────────────────────────────────

export type EquipmentStatus = 'Available' | 'Partial' | 'Out';

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

// ─── Borrow Records ───────────────────────────────────────────────────────────

export type BorrowStatus = 'borrowed' | 'overdue' | 'returned';

export interface BorrowRecordEntity {
  id: string;
  equipment_id: string;
  borrower_name: string;
  borrower_id: string;
  purpose?: string;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: BorrowStatus;
  notes?: string;
  authorized_by?: string;
  photo_proof?: string;
  quantity: number;
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

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserEntity {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'staff';
  created_at: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  statusCode: number;
}
