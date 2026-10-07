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
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: BorrowStatus;
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
