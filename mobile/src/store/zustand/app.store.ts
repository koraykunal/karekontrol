import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark' | 'system';
type Language = 'tr' | 'en';

interface AppState {
  // State
  theme: Theme;
  language: Language;
  isOnline: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

/**
 * App-wide settings store
 * Persists theme, language preferences, and network status
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'system',
      language: 'tr',
      isOnline: true,

      // Actions
      setTheme: (theme: Theme) => set({ theme }),

      setLanguage: (language: Language) => set({ language }),

      setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
