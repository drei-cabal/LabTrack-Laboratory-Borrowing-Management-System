import { useState, useEffect, useCallback } from 'react';
import { equipmentController } from '../server/controllers/equipmentController';
import { EquipmentWithDetails } from '../backend/types';
import { FilterOption } from '../components/ui/FilterChips';

export function useEquipment() {
  const [items, setItems] = useState<EquipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('All');
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await equipmentController.getAll({
        search,
        filter,
      });

      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.error || 'Failed to load equipment.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch equipment.');
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    search,
    setSearch,
    filter,
    setFilter,
    refresh: fetchItems,
    error,
  };
}
