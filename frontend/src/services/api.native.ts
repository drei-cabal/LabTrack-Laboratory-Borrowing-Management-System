import { handleOfflineRequest } from '../offline/request';
import { tokenStore } from './tokenStore';
import type { ApiResponse } from './api';

export type { ApiResponse } from './api';

export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    return await handleOfflineRequest<T>(path, options, await tokenStore.getToken());
  } catch {
    return { success: false, error: 'Unable to open the saved session on this device.', statusCode: 500 };
  }
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
