import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'labtrack_auth_token';
const USER_KEY = 'labtrack_auth_user';

// In-memory fallback
const memoryStore: Record<string, string> = {};

function getWebItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // In case localStorage is disabled or restricted
    }
  }
  return memoryStore[key] ?? null;
}

function setWebItem(key: string, value: string): void {
  memoryStore[key] = value;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // In case localStorage is disabled or restricted
    }
  }
}

function removeWebItem(key: string): void {
  delete memoryStore[key];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // In case localStorage is disabled or restricted
    }
  }
}

export const tokenStore = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') return getWebItem(TOKEN_KEY);
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      setWebItem(TOKEN_KEY, token);
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
      raw = getWebItem(USER_KEY);
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
      setWebItem(USER_KEY, raw);
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, raw);
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      removeWebItem(TOKEN_KEY);
      removeWebItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
