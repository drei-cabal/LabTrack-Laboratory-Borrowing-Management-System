import { Platform } from 'react-native';

/**
 * Returns the base API URL based on platform & build mode.
 * - Web / iOS simulator   → localhost
 * - Android emulator      → 10.0.2.2 (maps to host machine's localhost)
 * - Physical device       → set EXPO_PUBLIC_API_URL in .env
 */
function getBaseUrl(): string {
  // Allow override via environment variable (for physical devices or production)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api';
  }

  return 'http://localhost:3001/api';
}

export const API_BASE_URL = getBaseUrl();
