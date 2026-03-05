import { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { apiClient, refreshClient } from './axios.config';

if (!apiClient) {
  throw new Error('apiClient is not defined');
}
import { tokenStorage } from '../../features/auth/utils/token-storage';
import type { RefreshTokenResponse } from '../types/auth.types';

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAuthEndpoint = config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh');

    if (!isAuthEndpoint) {
      if (!config.headers.Authorization) {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refreshToken = await tokenStorage.getRefreshToken();

          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Token refresh timeout')), 10000);
          });

          const response = await Promise.race([
            refreshClient.post<RefreshTokenResponse>('/auth/refresh/', {
              refresh: refreshToken,
            }),
            timeoutPromise,
          ]);

          const { access_token, refresh_token } = response.data;

          await tokenStorage.setAccessToken(access_token);
          if (refresh_token) {
            await tokenStorage.setRefreshToken(refresh_token);
          }

          return access_token;
        })()
          .catch(async (refreshError) => {
            const { clearAuthState } = await import('../../utils/auth-utils');
            await clearAuthState();
            throw refreshError;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
