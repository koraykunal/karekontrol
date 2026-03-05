import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';
import type { Organization, Department } from '../types/organization.types';

export const organizationEndpoints = {
    // Organization
    getOrganizations: () =>
        apiClient.get<PaginatedResponse<Organization>>('/organizations/'),

    getOrganization: (id: number) =>
        apiClient.get<ApiResponse<Organization>>(`/organizations/${id}/`),

    updateOrganization: (id: number, data: Partial<Organization>) =>
        apiClient.patch<ApiResponse<Organization>>(`/organizations/${id}/`, data),

    // Departments
    getDepartments: (params?: any) =>
        apiClient.get<PaginatedResponse<Department>>('/departments/', { params }),

    getDepartment: (id: number) =>
        apiClient.get<ApiResponse<Department>>(`/departments/${id}/`),

    createDepartment: (data: Partial<Department>) =>
        apiClient.post<ApiResponse<Department>>('/departments/', data),

    updateDepartment: (id: number, data: Partial<Department>) =>
        apiClient.patch<ApiResponse<Department>>(`/departments/${id}/`, data),

    deleteDepartment: (id: number) =>
        apiClient.delete<void>(`/departments/${id}/`),
};
