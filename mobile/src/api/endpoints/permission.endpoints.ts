import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';

export interface RolePermissionConfig {
    id: number;
    organization: number | null;
    organization_name: string | null;
    department: number | null;
    department_name: string | null;
    role: string;
    permissions: Record<string, boolean | string>;
    configured_by_user: number | null;
    configured_by_name: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateRolePermissionConfigData {
    organization?: number;
    department?: number;
    role: string;
    permissions: Record<string, boolean | string>;
    notes?: string;
}

export interface UpdateRolePermissionConfigData {
    permissions?: Record<string, boolean | string>;
    notes?: string;
    is_active?: boolean;
}

export const permissionEndpoints = {
    // Role Permission Configs
    getRoleConfigs: (params?: { organization?: number; department?: number; role?: string }) =>
        apiClient.get<PaginatedResponse<RolePermissionConfig>>('/permissions/policies/', { params }),

    getRoleConfig: (id: number) =>
        apiClient.get<ApiResponse<RolePermissionConfig>>(`/permissions/policies/${id}/`),

    createRoleConfig: (data: CreateRolePermissionConfigData) =>
        apiClient.post<ApiResponse<RolePermissionConfig>>('/permissions/policies/', data),

    updateRoleConfig: (id: number, data: UpdateRolePermissionConfigData) =>
        apiClient.patch<ApiResponse<RolePermissionConfig>>(`/permissions/policies/${id}/`, data),

    saveRoleConfig: (data: CreateRolePermissionConfigData) =>
        apiClient.post<ApiResponse<RolePermissionConfig>>('/permissions/policies/save/', data),

    deleteRoleConfig: (id: number) =>
        apiClient.delete<void>(`/permissions/policies/${id}/`),
};
