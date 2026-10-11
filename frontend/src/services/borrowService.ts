import { api } from './api';
import type {
  BorrowRecordWithEquipment,
  CreateBorrowTransactionPayload,
} from '../types';

export const borrowService = {
  /** GET /api/borrow?status=... */
  getAll(status?: 'borrowed' | 'overdue' | 'returned' | 'all') {
    const qs = status && status !== 'all' ? `?status=${status}` : '';
    return api.get<BorrowRecordWithEquipment[]>(`/borrow${qs}`);
  },

  /** GET /api/borrow/:id */
  getById(id: string) {
    return api.get<BorrowRecordWithEquipment>(`/borrow/${id}`);
  },

  /** POST /api/borrow (multi-step transaction) */
  createTransaction(payload: CreateBorrowTransactionPayload) {
    return api.post<BorrowRecordWithEquipment[]>('/borrow', payload);
  },

  /** PUT /api/borrow/:id/return */
  returnRecord(id: string) {
    return api.put<BorrowRecordWithEquipment>(`/borrow/${id}/return`, {});
  },
};
