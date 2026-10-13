import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../types';

// ─── Augment Express Request ──────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: string;
      };
    }
  }
}

// ─── JWT Payload shape ────────────────────────────────────────────────────────

interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Reads the `Authorization: Bearer <token>` header, verifies the JWT,
 * and attaches the decoded payload to `req.user`.
 * Returns 401 if the token is missing or invalid.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const body: ApiResponse<never> = {
      success: false,
      error: 'Authorization token is required.',
      statusCode: 401,
    };
    res.status(401).json(body);
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const secret = process.env.JWT_SECRET ?? 'labtrack_jwt_secret_2024';

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch {
    const body: ApiResponse<never> = {
      success: false,
      error: 'Invalid or expired token.',
      statusCode: 401,
    };
    res.status(401).json(body);
  }
}

/**
 * Ensures the authenticated user has the 'admin' role.
 * Must be preceded by `authenticate`.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    const body: ApiResponse<never> = {
      success: false,
      error: 'Admin access required.',
      statusCode: 403,
    };
    res.status(403).json(body);
    return;
  }
  next();
}
