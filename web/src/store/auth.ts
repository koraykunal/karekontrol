'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    hydrated: boolean
}

interface AuthActions {
    setUser: (user: User) => void
    setAuthenticated: () => void
    logout: () => void
    setHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            hydrated: false,

            setUser: (user) => set({ user, isAuthenticated: true }),

            setAuthenticated: () => set({ isAuthenticated: true }),

            logout: () => set({ user: null, isAuthenticated: false }),

            setHydrated: (value) => set({ hydrated: value }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true)
            },
        },
    ),
)
