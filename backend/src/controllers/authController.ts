import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { UserEntity } from '../types';
import { handleSuccess, handleError } from '../middleware/errorHandler';

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'assistant' | 'staff';
  full_name?: string;
  is_active?: number;
  created_at: string;
}

/**
 * POST /api/auth/login
 * Validates credentials and returns a signed JWT.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'username and password are required.',
        statusCode: 400,
      });
      return;
    }

    const user = db
      .prepare<[string], UserRow>('SELECT * FROM users WHERE username = ?')
      .get(username);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
        statusCode: 401,
      });
      return;
    }

    // Check if account is active
    if (user.is_active === 0) {
      res.status(403).json({
        success: false,
        error: 'Account is deactivated. Contact an administrator.',
        statusCode: 403,
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
        statusCode: 401,
      });
      return;
    }

    const secret = process.env.JWT_SECRET ?? 'labtrack_jwt_secret_2024';
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

    const payload = { userId: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

    handleSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          full_name: user.full_name ?? user.username,
          is_active: user.is_active !== 0,
        },
      },
      'Login successful.'
    );

  } catch (error) {
    handleError(res, error, 'authController.login');
  }
}
