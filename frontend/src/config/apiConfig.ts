import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

/**
 * Returns the base API URL based on platform & build mode:
 * 1. EXPO_PUBLIC_API_URL environment variable (highest priority)
 * 2. In Expo Go / Dev Client on physical devices, auto-detect host computer's LAN IP from Constants.expoConfig
 * 3. Android Emulator fallback (10.0.2.2 maps to host machine localhost)
 * 4. Default for Web / iOS Simulator (localhost)
 */
function getBaseUrl(): string {
  // 1. Explicit env variable override (highest priority)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }

  // 2. Auto-detect host IP when running via Expo Go / Metro dev server on physical devices
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3001/api`;
    }
  }

  // 3. Android Emulator (10.0.2.2 is the special alias to host loopback interface)
  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:3001/api';
  }

  // 4. Fallback default (Web, iOS Simulator, or host machine)
  return 'http://localhost:3001/api';
}

export const API_BASE_URL = getBaseUrl();
