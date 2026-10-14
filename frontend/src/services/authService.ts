import { api } from './api';
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

export const authService = {
  /**
   * Authenticates the user against the REST API.
   * On success, stores the JWT token and user info in SecureStore.
   */
  async login(payload: LoginPayload): Promise<{ success: boolean; error?: string }> {
    const res = await api.post<LoginResponse>('/auth/login', payload);

    if (res.success && res.data) {
      await tokenStore.setToken(res.data.token);
      await tokenStore.setUser(res.data.user);
      return { success: true };
    }

    return {
      success: false,
      error: res.error ?? 'Invalid credentials.',
    };
  },

  /**
   * Clears the stored token and user, effectively logging out.
   */
  async logout(): Promise<void> {
    await tokenStore.clear();
  },

  /**
   * Returns the currently logged-in user, or null if not authenticated.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    return tokenStore.getUser();
  },

  /**
   * Returns true if a token is currently stored.
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await tokenStore.getToken();
    return token !== null;
  },
};
