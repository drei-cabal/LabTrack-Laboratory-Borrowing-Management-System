import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// ─── Success helper ───────────────────────────────────────────────────────────

/**
 * Send a standardized success JSON response.
 */
export function handleSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
    statusCode,
  };
  res.status(statusCode).json(body);
}

// ─── Error helper ─────────────────────────────────────────────────────────────

/**
 * Log and send a standardized error JSON response.
 */
export function handleError(
  res: Response,
  error: unknown,
  context: string,
  statusCode = 500
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] ${context}:`, message);

  const body: ApiResponse<never> = {
    success: false,
    error: message,
    statusCode,
  };
  res.status(statusCode).json(body);
}

// ─── 404 handler ─────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiResponse<never> = {
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  };
  res.status(404).json(body);
}

// ─── Global error handler ─────────────────────────────────────────────────────

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error('[UNHANDLED ERROR]', err);
  const body: ApiResponse<never> = {
    success: false,
    error: err.message ?? 'Internal server error',
    statusCode: 500,
  };
  res.status(500).json(body);
}
