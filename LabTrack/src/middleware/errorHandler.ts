import { AppLogger } from './logger';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  message?: string;
}

export function handleSuccess<T>(data: T, message?: string, statusCode = 200): ApiResponse<T> {
  return {
    success: true,
    statusCode,
    data,
    message,
  };
}

export function handleError(error: unknown, context: string, defaultMessage = 'An unexpected error occurred.'): ApiResponse {
  let message = defaultMessage;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  AppLogger.error(context, message, error);

  return {
    success: false,
    statusCode: 500,
    error: message,
  };
}
