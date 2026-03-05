import { UserRole } from './enums';

// Simplified permission structure (flat toggles)
export type UserPermissions = Record<string, boolean | string>;

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  organization: number;
  organization_name: string;
  department: number | null;
  department_name: string | null;
  is_super_admin: boolean;
  is_admin: boolean;
  is_manager: boolean;
  is_active: boolean;
  phone: string | null;
  avatar_url: string | null;
  permissions?: UserPermissions;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  full_name: string;
  password: string;
  password_confirm?: string;
  organization?: number;
  department?: number;
  phone?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}
