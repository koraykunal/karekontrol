import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../../api/types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  organization: number | null;
  isInitialized: boolean;

  setUser: (user: User) => void;
  clearAuth: () => void;
  updateOrganization: (orgId: number) => void;
  updateUser: (updates: Partial<User>) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      organization: null,
      isInitialized: false,

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          organization: user.organization,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          organization: null,
        });
      },

      updateOrganization: (orgId: number) => {
        const { user } = get();
        if (user) {
          set({
            organization: orgId,
            user: { ...user, organization: orgId },
          });
        }
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },

      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        organization: state.organization,
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          full_name: state.user.full_name,
          role: state.user.role,
          organization: state.user.organization,
          organization_name: state.user.organization_name,
          department: state.user.department,
          department_name: state.user.department_name,
          phone: state.user.phone,
          avatar_url: state.user.avatar_url,
        } : null,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
