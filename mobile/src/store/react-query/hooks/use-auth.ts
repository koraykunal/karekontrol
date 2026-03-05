import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../../api/services/auth.service';
import { tokenStorage } from '../../../features/auth/utils/token-storage';
import { useAuthStore } from '../../zustand/auth.store';
import { queryKeys } from '../keys';
import { createTaggedLogger } from '../../../utils/logger';
import type { LoginRequest, ChangePasswordRequest } from '../../../api/types/auth.types';

const log = createTaggedLogger('Auth');

export function useLogin() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(state => state.setUser);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      log.info('Login success');

      if (!response.data) {
        log.error('No data in response');
        return;
      }

      const { user, access_token, refresh_token } = response.data;

      log.debug('User:', user.email);

      await Promise.all([
        tokenStorage.setAccessToken(access_token),
        tokenStorage.setRefreshToken(refresh_token),
      ]);

      log.debug('Tokens stored');

      setUser(user);

      log.info('Auth store updated, authenticated:', useAuthStore.getState().isAuthenticated);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entities.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.procedures.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
      ]);
    },
    onError: (error: any) => {
      log.error('Login error:', error.response?.data || error.message);
    },
  });
}

export function useMe() {
  const setUser = useAuthStore(state => state.setUser);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const response = await authService.getMe();
      if (!response.data) throw new Error('No user data');
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore(state => state.clearAuth);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await tokenStorage.getRefreshToken();
      await authService.logout(refreshToken || undefined);
    },
    onSuccess: async () => {
      await tokenStorage.clearTokens();
      const { useOfflineStore } = await import('../../zustand/offline.store');
      useOfflineStore.getState().clearQueue();
      clearAuth();
      queryClient.clear();
    },
    onError: async () => {
      await tokenStorage.clearTokens();
      const { useOfflineStore } = await import('../../zustand/offline.store');
      useOfflineStore.getState().clearQueue();
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
  });
}
