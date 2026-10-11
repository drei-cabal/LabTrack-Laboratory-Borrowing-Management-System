import { api } from './api';
import type { EquipmentWithDetails, BorrowRecordEntity } from '../types';

export interface EquipmentDetailPayload {
  equipment: EquipmentWithDetails;
  activeRecords: BorrowRecordEntity[];
}

export interface CreateEquipmentData {
  product_id?: string;
  name: string;
  brand?: string;
  model?: string;
  description: string;
  total_quantity: number;
}

export type UpdateEquipmentData = CreateEquipmentData;

export const equipmentService = {
  /** GET /api/equipment?search=...&filter=... */
  getAll(params?: { search?: string; filter?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.filter && params.filter !== 'All') query.set('filter', params.filter);
    const qs = query.toString();
    return api.get<EquipmentWithDetails[]>(`/equipment${qs ? `?${qs}` : ''}`);
  },

  /** GET /api/equipment/:id */
  getById(id: string) {
    return api.get<EquipmentDetailPayload>(`/equipment/${id}`);
  },

  /** POST /api/equipment */
  create(data: CreateEquipmentData) {
    return api.post<EquipmentWithDetails>('/equipment', data);
  },

  /** PUT /api/equipment/:id */
  update(id: string, data: UpdateEquipmentData) {
    return api.put<EquipmentWithDetails>(`/equipment/${id}`, data);
  },

  /** DELETE /api/equipment/:id */
  delete(id: string) {
    return api.delete<boolean>(`/equipment/${id}`);
  },
};
