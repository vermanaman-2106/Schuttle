import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../api/auth';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (token, user) => {
    // Update state immediately for instant UI response
      set({ token, user, isAuthenticated: true });
    
    // Save to AsyncStorage in background (non-blocking)
    // Don't await - let it happen in background, navigation works immediately
    Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
    ]).catch((error) => {
      console.error('Error saving auth data to storage (non-critical):', error);
      // Don't revert state - user is already logged in, storage is just for persistence
    });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      set({ token: null, user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  restoreSession: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      set({ isLoading: false });
    }
  },

  // Refresh user data from database (useful when verification status changes in MongoDB)
  refreshUser: async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.user) {
        const updatedUser = {
          id: response.user.id,
          ...response.user,
        };
        set({ user: updatedUser });
        // Update AsyncStorage in background
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser)).catch((err) => {
          console.error('Error updating user in storage:', err);
        });
        return updatedUser;
      }
    } catch (error) {
      // Only log if it's not a 404 (endpoint might not be deployed yet)
      if (error.response?.status !== 404) {
        console.error('Error refreshing user:', error);
      }
      // Don't throw - just log the error, keep existing user data
      // Return null to indicate refresh failed
      return null;
    }
  },
}));
