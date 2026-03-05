/**
 * Auth utilities for shared auth operations
 * Avoids circular dependencies by using dynamic imports
 */

/**
 * Clear auth state and tokens
 * Used by interceptors when refresh fails
 */
export const clearAuthState = async () => {
    const { useAuthStore } = await import('../store/zustand/auth.store');
    const { tokenStorage } = await import('../features/auth/utils/token-storage');

    await tokenStorage.clearTokens();
    useAuthStore.getState().clearAuth();
};

/**
 * Get current user from auth store
 * For use in service layers that need user context
 */
export const getCurrentUser = async () => {
    const { useAuthStore } = await import('../store/zustand/auth.store');
    return useAuthStore.getState().user;
};
