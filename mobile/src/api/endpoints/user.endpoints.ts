import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';
import type { User } from '../types/auth.types';
import { UserRole } from '../types/enums';

export interface UserFilters {
    role?: UserRole;
    is_active?: boolean;
    organization?: number;
    department?: number;
    search?: string;
    page?: number;
    page_size?: number;
}

export interface CreateUserData {
    email: string;
    full_name: string;
    password: string;
    password_confirm?: string;
    organization?: number;
    department?: number;
    phone?: string;
    role?: UserRole;
}

export interface UpdateUserData {
    full_name?: string;
    phone?: string;
    department?: number;
    avatar_url?: string;
}

export const userEndpoints = {
    getUsers: (params?: UserFilters) =>
        apiClient.get<PaginatedResponse<User>>('/users/', { params }),

    getUser: (id: number) =>
        apiClient.get<ApiResponse<User>>(`/users/${id}/`),

    getUsersByDepartment: (departmentId: number) =>
        apiClient.get<PaginatedResponse<User>>(`/users/department/${departmentId}/`),

    createUser: (data: CreateUserData) =>
        apiClient.post<ApiResponse<User>>('/users/', data),

    updateUser: (id: number, data: UpdateUserData) =>
        apiClient.patch<ApiResponse<User>>(`/users/${id}/`, data),

    updateRole: (id: number, role: UserRole) =>
        apiClient.put<ApiResponse<User>>(`/users/${id}/role/`, { role }),

    activateUser: (id: number) =>
        apiClient.post<ApiResponse<User>>(`/users/${id}/activate/`),

    deactivateUser: (id: number) =>
        apiClient.delete<void>(`/users/${id}/`),
};
