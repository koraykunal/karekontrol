import { apiClient } from '../client';
import { authEndpoints } from '../endpoints/auth.endpoints';
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

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await authEndpoints.login(data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await authEndpoints.register(data);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await authEndpoints.refreshToken(refreshToken);
    return response.data;
  },

  getMe: async () => {
    const response = await authEndpoints.getMe();
    return response.data;
  },

  logout: async (refreshToken?: string) => {
    if (refreshToken) {
      await authEndpoints.logout(refreshToken);
    }
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await authEndpoints.changePassword(data);
    return response.data;
  },
};
