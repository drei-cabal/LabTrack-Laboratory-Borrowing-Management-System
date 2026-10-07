import { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../services/equipmentService';
import { EquipmentWithDetails, BorrowRecordEntity } from '../backend/types';

export function useEquipmentDetail(id: string | undefined) {
  const [equipment, setEquipment] = useState<EquipmentWithDetails | null>(null);
  const [activeRecords, setActiveRecords] = useState<BorrowRecordEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await equipmentService.getById(id);
      if (res.success && res.data) {
        setEquipment(res.data.equipment);
        setActiveRecords(res.data.activeRecords);
      } else {
        setError(res.error || 'Failed to load details.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    equipment,
    activeRecords,
    loading,
    error,
    refresh: fetchDetail,
  };
}
