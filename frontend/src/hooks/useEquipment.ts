import { useState, useEffect, useCallback } from 'react';
import { equipmentService } from '../services/equipmentService';
import { EquipmentWithDetails } from '../types';
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
      const res = await equipmentService.getAll({ search, filter });

      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setError(res.error || 'Failed to load equipment.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch equipment.');
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
