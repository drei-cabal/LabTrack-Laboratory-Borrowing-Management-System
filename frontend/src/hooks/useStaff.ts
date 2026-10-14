import { useState, useEffect, useCallback } from 'react';
import { staffService } from '../services/staffService';
import type { StaffEntity, CreateStaffPayload, UpdateStaffPayload } from '../types';

export function useStaff(initialSearch: string = '') {
  const [staff, setStaff] = useState<StaffEntity[]>([]);
  const [search, setSearch] = useState<string>(initialSearch);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(
    async (isPullToRefresh = false) => {
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await staffService.getAll({ search });
        if (res.success && res.data) {
          setStaff(res.data);
        } else {
          setError(res.error || 'Failed to load staff accounts.');
        }
      } catch (err: any) {
        setError(err?.message || 'Network error loading staff.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const refresh = useCallback(() => {
    return fetchStaff(true);
  }, [fetchStaff]);

  const createStaff = async (payload: CreateStaffPayload) => {
    try {
      const res = await staffService.create(payload);
      if (res.success && res.data) {
        await fetchStaff(true);
        return { success: true, data: res.data };
      }
      return { success: false, error: res.error || 'Failed to create staff member.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error creating staff.' };
    }
  };

  const updateStaff = async (id: string, payload: UpdateStaffPayload) => {
    try {
      const res = await staffService.update(id, payload);
      if (res.success && res.data) {
        await fetchStaff(true);
        return { success: true, data: res.data };
      }
      return { success: false, error: res.error || 'Failed to update staff member.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating staff.' };
    }
  };

  const toggleStatus = async (id: string, is_active: boolean) => {
    try {
      const res = await staffService.toggleStatus(id, is_active);
      if (res.success && res.data) {
        await fetchStaff(true);
        return { success: true, data: res.data };
      }
      return { success: false, error: res.error || 'Failed to update account status.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating status.' };
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const res = await staffService.delete(id);
      if (res.success) {
        await fetchStaff(true);
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to delete staff member.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting staff.' };
    }
  };

  return {
    staff,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    fetchStaff,
    refresh,
    createStaff,
    updateStaff,
    toggleStatus,
    deleteStaff,
  };
}
