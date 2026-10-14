import { api, ApiResponse } from './api';
import { DashboardData } from '../types';

export const dashboardService = {
  /**
   * Fetches dashboard summary statistics, overdue items, and recent transactions.
   */
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    return api.get<DashboardData>('/dashboard');
  },
};
