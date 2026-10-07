import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Validates equipment request body.
 * Rules:
 *  - name: required, minimum 2 characters
 *  - total_quantity: required, integer >= 1
 */
export function validateEquipmentInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors: string[] = [];
  const { name, total_quantity } = req.body as { name?: unknown; total_quantity?: unknown };

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name is required and must be at least 2 characters long.');
  }

  // Validate total_quantity
  const qty = Number(total_quantity);
  if (total_quantity === undefined || total_quantity === null || total_quantity === '') {
    errors.push('total_quantity is required.');
  } else if (!Number.isInteger(qty) || qty < 1) {
    errors.push('total_quantity must be an integer greater than or equal to 1.');
  }

  if (errors.length > 0) {
    const body: ApiResponse<never> = {
      success: false,
      error: 'Validation failed.',
      errors,
      statusCode: 400,
    };
    res.status(400).json(body);
    return;
  }

  next();
}
