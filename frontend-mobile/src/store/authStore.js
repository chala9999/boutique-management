import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/auth';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Connexion
  login: async (credentials) => {
    const data = await authAPI.login(credentials);
    await AsyncStorage.setItem('access_token', data.access);
    await AsyncStorage.setItem('refresh_token', data.refresh);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  // Inscription
  register: async (userData) => {
    const data = await authAPI.register(userData);
    await AsyncStorage.setItem('access_token', data.access);
    await AsyncStorage.setItem('refresh_token', data.refresh);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  // Charger le profil
  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authAPI.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Déconnexion
  logout: async () => {
    await authAPI.logout();
    set({ user: null, isAuthenticated: false });
  },
}));