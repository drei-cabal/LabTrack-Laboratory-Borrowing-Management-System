import { API_BASE_URL } from '../config/apiConfig';
import { tokenStore } from './tokenStore';

const REQUEST_TIMEOUT_MS = 10000;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  statusCode?: number;
}

/**
 * Core fetch wrapper. Automatically attaches the auth token if available.
 * Always resolves to an ApiResponse shape — never throws.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await tokenStore.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        signal: options.signal ?? controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const json = await response.json();
    return json as ApiResponse<T>;
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const isNetworkError =
      rawMessage === 'Failed to fetch' ||
      rawMessage.includes('Network request failed') ||
      rawMessage.includes('ECONNREFUSED') ||
      rawMessage.includes('aborted');

    const message = isNetworkError
      ? `Cannot connect to backend server at ${API_BASE_URL}. Make sure the backend is running and the phone is on the same network.`
      : rawMessage;

    return {
      success: false,
      error: message,
      statusCode: 0,
    };
  }
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
