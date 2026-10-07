import { Request, Response, NextFunction } from 'express';

/**
 * Simple request logger middleware.
 * Logs: [METHOD] /path - ISO timestamp
 */
export function logger(req: Request, _res: Response, next: NextFunction): void {
  console.log(`[${req.method}] ${req.path} - ${new Date().toISOString()}`);
  next();
}
