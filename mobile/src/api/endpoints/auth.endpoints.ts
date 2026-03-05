import { apiClient } from '../client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChangePasswordRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User
} from '../types/auth.types';
import type { ApiResponse } from '../types/common.types';

export const authEndpoints = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login/', data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register/', data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<RefreshTokenResponse>('/auth/refresh/', {
      refresh: refreshToken,
    }),

  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me/'),

  logout: (refreshToken?: string) =>
    apiClient.post('/auth/logout/', {
      refresh_token: refreshToken,
    }),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<ApiResponse<void>>('/auth/change-password/', data),
};


