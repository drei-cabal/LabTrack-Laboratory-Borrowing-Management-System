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
  returnRecord(id: string, returnDate?: string, returnRemarks?: string) {
    return api.put<BorrowRecordWithEquipment>(`/borrow/${id}/return`, {
      return_date: returnDate,
      return_remarks: returnRemarks,
    });
  },

  /** GET /api/borrow/transactions */
  getTransactions(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (search && search.trim()) params.append('search', search.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get<any[]>(`/borrow/transactions${qs}`);
  },

  /** POST /api/borrow/return */
  processReturn(payload: any) {
    return api.post<any>('/borrow/return', payload);
  },
};
