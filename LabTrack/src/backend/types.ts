export type EquipmentStatus = 'Available' | 'Partial' | 'Out';

export type BorrowStatus = 'borrowed' | 'overdue' | 'returned';

export interface EquipmentEntity {
  id: string;
  name: string;
  description: string;
  total_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface BorrowRecordEntity {
  id: string;
  equipment_id: string;
  borrower_name: string;
  borrower_id: string;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  status: BorrowStatus;
  notes?: string;
}

export interface EquipmentWithDetails extends EquipmentEntity {
  borrowed_count: number;
  available_quantity: number;
  status: EquipmentStatus;
}
