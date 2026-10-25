import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'labtrack_auth_token';
const USER_KEY = 'labtrack_auth_user';

// Keep a memory fallback for non-browser web runtimes and tests
const webStore: Record<string, string> = {};

function getWebValue(key: string): string | null {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // In case localStorage is restricted or disabled
    }
  }
  return webStore[key] ?? null;
}

function setWebValue(key: string, value: string): void {
  webStore[key] = value;
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // In case localStorage is restricted or disabled
    }
  }
}

function removeWebValue(key: string): void {
  delete webStore[key];
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // In case localStorage is restricted or disabled
    }
  }
}

export const tokenStore = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') return getWebValue(TOKEN_KEY);
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      setWebValue(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getUser(): Promise<{
    username: string;
    role: string;
    id?: string;
    full_name?: string;
    is_active?: boolean;
  } | null> {
    let raw: string | null;
    if (Platform.OS === 'web') {
      raw = getWebValue(USER_KEY);
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

  async setUser(user: {
    username: string;
    role: string;
    id?: string;
    full_name?: string;
    is_active?: boolean;
  }): Promise<void> {
    const raw = JSON.stringify(user);
    if (Platform.OS === 'web') {
      setWebValue(USER_KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, raw);
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      removeWebValue(TOKEN_KEY);
      removeWebValue(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
