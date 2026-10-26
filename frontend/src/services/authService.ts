import { Platform } from 'react-native';
import { api, type ApiResponse } from './api';
import { tokenStore } from './tokenStore';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthUser {
  id?: string;
  username: string;
  role: string;
  full_name?: string;
  is_active?: boolean;
}


export interface LoginResponse {
  token: string;
  user: AuthUser;
}

async function saveSession(res: ApiResponse<LoginResponse>): Promise<{ success: boolean; error?: string }> {
  if (!res.success || !res.data) return { success: false, error: res.error || 'Unable to sign in.' };
  await tokenStore.setToken(res.data.token);
  await tokenStore.setUser(res.data.user);
  return { success: true };
}

export const authService = {
  /**
   * Uses the platform data source and stores its session in SecureStore.
   */
  async login(payload: LoginPayload): Promise<{ success: boolean; error?: string }> {
    const res = await api.post<LoginResponse>('/auth/login', payload);

    return saveSession(res);
  },

  async needsSetup(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const res = await api.get<{ needs_setup: boolean }>('/auth/setup-status');
    if (!res.success || !res.data) throw new Error(res.error || 'Unable to open local accounts.');
    return res.data.needs_setup;
  },

  async setup(payload: LoginPayload & { full_name: string }): Promise<{ success: boolean; error?: string }> {
    return saveSession(await api.post<LoginResponse>('/auth/setup', payload));
  },

  /**
   * Clears the stored token and user, effectively logging out.
   */
  async logout(): Promise<void> {
    if (Platform.OS !== 'web') {
      const res = await api.post<boolean>('/auth/logout', {});
      if (!res.success) throw new Error(res.error || 'Unable to close the local session.');
    }
    await tokenStore.clear();
  },

  /**
   * Returns the currently logged-in user, or null if not authenticated.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (Platform.OS !== 'web') {
      if (!await tokenStore.getToken()) return null;
      const res = await api.get<AuthUser>('/auth/me');
      if (res.success && res.data) return res.data;
      if (res.statusCode === 401) {
        await tokenStore.clear();
        return null;
      }
      throw new Error(res.error || 'Unable to read the local session.');
    }
    return tokenStore.getUser();
  },

  /**
   * Returns true if a token is currently stored.
   */
  async isAuthenticated(): Promise<boolean> {
    return (await this.getCurrentUser()) !== null;
  },
};
