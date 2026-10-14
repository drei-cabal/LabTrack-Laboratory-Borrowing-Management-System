import { Request, Response } from 'express';
import { dashboardRepository } from '../repositories/dashboardRepository';
import { handleSuccess, handleError } from '../middleware/errorHandler';

/**
 * GET /api/dashboard
 * Retrieves dashboard statistics, overdue items, and recent transactions.
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const data = dashboardRepository.getDashboardData();
    handleSuccess(res, data, 'Dashboard data retrieved successfully.');
  } catch (error) {
    handleError(res, error, 'dashboardController.getDashboard');
  }
}
