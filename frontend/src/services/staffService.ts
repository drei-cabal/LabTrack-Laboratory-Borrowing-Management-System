import { api, ApiResponse } from './api';
import { StaffEntity, CreateStaffPayload, UpdateStaffPayload } from '../types';

export const staffService = {
  /**
   * Fetches all staff members with optional search and role filtering.
   */
  async getAll(params?: { search?: string; role?: string }): Promise<ApiResponse<StaffEntity[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    const queryString = query.toString();
    const endpoint = queryString ? `/staff?${queryString}` : '/staff';
    return api.get<StaffEntity[]>(endpoint);
  },

  /**
   * Fetches a single staff member by ID.
   */
  async getById(id: string): Promise<ApiResponse<StaffEntity>> {
    return api.get<StaffEntity>(`/staff/${id}`);
  },

  /**
   * Creates a new staff member account.
   */
  async create(payload: CreateStaffPayload): Promise<ApiResponse<StaffEntity>> {
    return api.post<StaffEntity>('/staff', payload);
  },

  /**
   * Updates an existing staff member.
   */
  async update(id: string, payload: UpdateStaffPayload): Promise<ApiResponse<StaffEntity>> {
    return api.put<StaffEntity>(`/staff/${id}`, payload);
  },

  /**
   * Activates or deactivates a staff member.
   */
  async toggleStatus(id: string, is_active: boolean): Promise<ApiResponse<StaffEntity>> {
    return api.put<StaffEntity>(`/staff/${id}/status`, { is_active });
  },

  /**
   * Deletes a staff member account.
   */
  async delete(id: string): Promise<ApiResponse<{ id: string }>> {
    return api.delete<{ id: string }>(`/staff/${id}`);
  },
};
