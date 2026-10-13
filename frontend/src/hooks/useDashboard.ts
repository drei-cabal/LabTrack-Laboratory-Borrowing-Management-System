import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { tokenStore } from '../services/tokenStore';
import type { DashboardData } from '../types';

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role: string;
    full_name?: string;
  } | null>(null);

  const fetchDashboard = useCallback(async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Load current user and dashboard data in parallel
      const [user, res] = await Promise.all([
        tokenStore.getUser(),
        dashboardService.getDashboardData(),
      ]);

      if (user) {
        setCurrentUser(user);
      }

      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard data.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error loading dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const refresh = useCallback(() => {
    return fetchDashboard(true);
  }, [fetchDashboard]);

  return {
    data,
    loading,
    refreshing,
    error,
    currentUser,
    refresh,
  };
}
