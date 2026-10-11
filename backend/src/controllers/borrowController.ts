import { Request, Response } from 'express';
import * as repo from '../repositories/borrowRepository';
import { handleSuccess, handleError } from '../middleware/errorHandler';
import { CreateBorrowTransactionPayload } from '../types';

/**
 * GET /api/borrow
 * Optional query: ?status=borrowed|overdue|returned|all
 */
export function getAll(req: Request, res: Response): void {
  try {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.toLowerCase() : undefined;
    const records = repo.getAll(statusFilter);
    handleSuccess(res, records, `${records.length} borrow record(s) retrieved.`);
  } catch (error) {
    handleError(res, error, 'borrowController.getAll');
  }
}

/**
 * GET /api/borrow/:id
 */
export function getById(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const record = repo.getById(id);
    if (!record) {
      res.status(404).json({
        success: false,
        error: `Borrow record with ID "${id}" not found.`,
        statusCode: 404,
      });
      return;
    }
    handleSuccess(res, record);
  } catch (error) {
    handleError(res, error, 'borrowController.getById');
  }
}

/**
 * POST /api/borrow
 * Creates a borrow transaction with 1 or more items.
 */
export function createTransaction(req: Request, res: Response): void {
  try {
    const body = req.body as CreateBorrowTransactionPayload;

    // Validation
    const errors: string[] = [];
    if (!body.borrower_name || !body.borrower_name.trim()) {
      errors.push('Borrower name is required.');
    }
    if (!body.borrower_id || !body.borrower_id.trim()) {
      errors.push('Borrower ID / Student ID is required.');
    }
    if (!body.purpose || !body.purpose.trim()) {
      errors.push('Purpose is required.');
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      errors.push('At least one equipment item must be selected.');
    } else {
      for (const item of body.items) {
        if (!item.equipment_id) {
          errors.push('Each selected item must have an equipment_id.');
        }
        if (!item.quantity || item.quantity < 1) {
          errors.push('Item quantity must be at least 1.');
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: errors[0],
        errors,
        statusCode: 400,
      });
      return;
    }

    const createdRecords = repo.createTransaction(body);
    handleSuccess(res, createdRecords, 'Borrow transaction approved and recorded.', 201);
  } catch (error: any) {
    const message = error?.message || 'Failed to process borrow transaction.';
    // If it's a stock availability error, return 422
    if (message.includes('Insufficient quantity') || message.includes('not found')) {
      res.status(422).json({
        success: false,
        error: message,
        statusCode: 422,
      });
      return;
    }
    handleError(res, error, 'borrowController.createTransaction');
  }
}

/**
 * PUT /api/borrow/:id/return
 * Marks an item as returned.
 */
export function returnRecord(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const updated = repo.returnRecord(id);
    if (!updated) {
      res.status(404).json({
        success: false,
        error: `Borrow record with ID "${id}" not found.`,
        statusCode: 404,
      });
      return;
    }
    handleSuccess(res, updated, 'Equipment marked as returned.');
  } catch (error) {
    handleError(res, error, 'borrowController.returnRecord');
  }
}
