import { useState, useEffect, useCallback } from 'react';
import { borrowService } from '../services/borrowService';
import { BorrowRecordWithEquipment } from '../types';

export function useBorrowRecords(statusFilter: 'all' | 'borrowed' | 'overdue' | 'returned' = 'all') {
  const [records, setRecords] = useState<BorrowRecordWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await borrowService.getAll(statusFilter);
      if (res.success && res.data) {
        setRecords(res.data);
      } else {
        setError(res.error || 'Failed to load borrow records.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch borrow records.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const returnItem = async (id: string): Promise<boolean> => {
    try {
      const res = await borrowService.returnRecord(id);
      if (res.success) {
        await fetchRecords();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    records,
    loading,
    error,
    refresh: fetchRecords,
    returnItem,
  };
}
