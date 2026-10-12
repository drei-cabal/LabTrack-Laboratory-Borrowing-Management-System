import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'labtrack_auth_token';
const USER_KEY = 'labtrack_auth_user';

// Web fallback — SecureStore is native-only
const webStore: Record<string, string> = {};

export const tokenStore = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') return webStore[TOKEN_KEY] ?? null;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStore[TOKEN_KEY] = token;
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getUser(): Promise<{ username: string; role: string; id?: string; full_name?: string; is_active?: boolean } | null> {
    let raw: string | null;
    if (Platform.OS === 'web') {
      raw = webStore[USER_KEY] ?? null;
    } else {
      raw = await SecureStore.getItemAsync(USER_KEY);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async setUser(user: { username: string; role: string; id?: string; full_name?: string; is_active?: boolean }): Promise<void> {
    const raw = JSON.stringify(user);
    if (Platform.OS === 'web') {
      webStore[USER_KEY] = raw;
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, raw);
  },


  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      delete webStore[TOKEN_KEY];
      delete webStore[USER_KEY];
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
