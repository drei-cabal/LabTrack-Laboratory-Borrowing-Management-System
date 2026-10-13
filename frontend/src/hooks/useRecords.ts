import { useState, useEffect, useCallback } from 'react';
import { recordService } from '../services/recordService';
import type { TransactionSummary, ReturnTransactionPayload } from '../types';

export function useRecords(initialFilter: string = 'all') {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(
    async (isPullToRefresh = false) => {
      try {
        if (isPullToRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await recordService.getTransactions(filter, search);
        if (res.success && res.data) {
          setTransactions(res.data);
        } else {
          setError(res.error || 'Failed to load records.');
        }
      } catch (err: any) {
        setError(err?.message || 'Network error loading records.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, search]
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refresh = useCallback(() => {
    return fetchTransactions(true);
  }, [fetchTransactions]);

  const processReturn = async (payload: ReturnTransactionPayload): Promise<boolean> => {
    try {
      const res = await recordService.processReturn(payload);
      if (res.success) {
        await fetchTransactions(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return {
    transactions,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    refreshing,
    error,
    refresh,
    processReturn,
  };
}
