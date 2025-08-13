import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prefer EXPO_PUBLIC_API_URL when set, otherwise infer per-platform sane defaults
export const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');

  if (Platform.OS === 'android') {
    // Android emulator maps host machine localhost to 10.0.2.2
    return 'http://10.0.2.2:3000';
  }

  // iOS simulator and web can use localhost
  return 'http://localhost:3000';
};

type ApiInit = RequestInit & { withAuth?: boolean };

export const apiFetch = async (path: string, init: ApiInit = {}) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (init.withAuth) {
    const token = await AsyncStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...init, headers });
  return response;
};


