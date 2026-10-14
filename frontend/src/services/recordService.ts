import { api } from './api';
import type {
  TransactionSummary,
  ReturnTransactionPayload,
  BorrowRecordWithEquipment,
  TransactionStatusFilter,
} from '../types';

export const recordService = {
  /**
   * GET /api/records?status=...&search=...
   */
  getTransactions(status?: TransactionStatusFilter, search?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get<TransactionSummary[]>(`/records${qs}`);
  },

  /**
   * GET /api/records/:code
   */
  getTransactionByCode(code: string) {
    return api.get<TransactionSummary>(`/records/${encodeURIComponent(code)}`);
  },

  /**
   * POST /api/records/return
   */
  processReturn(payload: ReturnTransactionPayload) {
    return api.post<{
      returned_records: BorrowRecordWithEquipment[];
      transaction: TransactionSummary | null;
    }>('/records/return', payload);
  },

  /**
   * PUT /api/records/:id/return
   */
  returnItem(id: string, returnDate?: string, returnRemarks?: string) {
    return api.put<BorrowRecordWithEquipment>(`/records/${id}/return`, {
      return_date: returnDate,
      return_remarks: returnRemarks,
    });
  },
};
