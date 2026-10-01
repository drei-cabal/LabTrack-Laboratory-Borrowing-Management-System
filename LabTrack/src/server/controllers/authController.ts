import { ApiResponse, handleSuccess, handleError } from '../../middleware/errorHandler';
import { AppLogger } from '../../middleware/logger';

// Default accepted demo credentials matching the design system
const VALID_ACCOUNTS: Record<string, string[]> = {
  'admin.cruz': ['admin123', 'password123', 'password', '12345678', 'admin'],
  'prof.cruz': ['admin123', 'password123', 'password'],
  'admin': ['admin123', 'admin', 'password'],
};

export class AuthController {
  login(username: string, password: string): ApiResponse<{ username: string; name: string }> {
    try {
      AppLogger.info('AuthController', `Attempting login for user: ${username}`);

      const userKey = username.trim().toLowerCase();
      const validPasswords = VALID_ACCOUNTS[userKey];

      if (!validPasswords || !validPasswords.includes(password.trim())) {
        AppLogger.warn('AuthController', `Failed login attempt for: ${username}`);
        return {
          success: false,
          statusCode: 401,
          error: 'Incorrect username or password.',
        };
      }

      AppLogger.info('AuthController', `Successful login for: ${username}`);
      return handleSuccess({
        username: username.trim(),
        name: 'Prof. Eduardo Cruz',
      });
    } catch (error) {
      return handleError(error, 'AuthController.login');
    }
  }
}

export const authController = new AuthController();
