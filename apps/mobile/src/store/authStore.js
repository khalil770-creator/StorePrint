import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Web fallback — SecureStore is native only
const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') return localStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key) => {
    if (Platform.OS === 'web') return localStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create((set, get) => ({
  user:         null,
  accessToken:  null,
  refreshToken: null,
  isLoading:    true,

  setTokens: (access, refresh) => {
    set({ accessToken: access, refreshToken: refresh });
    storage.setItem('access_token',  access);
    storage.setItem('refresh_token', refresh);
  },

  setUser: (user) => {
    set({ user });
    if (user) storage.setItem('current_user', JSON.stringify(user));
  },

  logout: () => {
    set({ user: null, accessToken: null, refreshToken: null });
    storage.deleteItem('access_token');
    storage.deleteItem('refresh_token');
    storage.deleteItem('current_user');
  },

  hydrate: async () => {
    try {
      const access  = await storage.getItem('access_token');
      const refresh = await storage.getItem('refresh_token');
      const userStr = await storage.getItem('current_user');
      const user    = userStr ? JSON.parse(userStr) : null;
      if (access) set({ accessToken: access, refreshToken: refresh, user });
    } finally {
      set({ isLoading: false });
    }
  },
}));
