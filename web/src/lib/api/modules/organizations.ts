import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, Organization, OrganizationListItem, Department, DepartmentListItem, CreateOrganizationPayload, CreateDepartmentPayload, OnboardOrganizationPayload, OnboardOrganizationResponse, QuotaInfo, SandboxResetResult } from '@/types'

export const organizationsApi = {
    list: async (params?: PaginationParams & { is_active?: boolean }): Promise<PaginatedResponse<OrganizationListItem>> => {
        const { data } = await apiClient.get('/organizations/', { params })
        return data
    },

    get: async (id: number): Promise<Organization> => {
        const { data } = await apiClient.get(`/organizations/${id}/`)
        return data
    },

    create: async (payload: CreateOrganizationPayload): Promise<ApiResponse<Organization>> => {
        const { data } = await apiClient.post('/organizations/', payload)
        return data
    },

    update: async (id: number, payload: Partial<CreateOrganizationPayload>): Promise<ApiResponse<Organization>> => {
        const { data } = await apiClient.patch(`/organizations/${id}/`, payload)
        return data
    },

    deactivate: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/organizations/${id}/`)
        return data
    },

    activate: async (id: number): Promise<ApiResponse<Organization>> => {
        const { data } = await apiClient.post(`/organizations/${id}/activate/`)
        return data
    },

    getDepartments: async (orgId: number, params?: PaginationParams): Promise<PaginatedResponse<DepartmentListItem>> => {
        const { data } = await apiClient.get(`/organizations/${orgId}/departments/`, { params })
        return data
    },

    onboard: async (payload: OnboardOrganizationPayload): Promise<ApiResponse<OnboardOrganizationResponse>> => {
        const { data } = await apiClient.post('/organizations/onboard/', payload)
        return data
    },

    getQuota: async (id: number): Promise<QuotaInfo> => {
        const { data } = await apiClient.get(`/organizations/${id}/quota/`)
        return data
    },

    resetSandbox: async (id: number, password: string): Promise<ApiResponse<SandboxResetResult>> => {
        const { data } = await apiClient.post(`/organizations/${id}/reset/`, { password })
        return data
    },
}

export const departmentsApi = {
    list: async (params?: PaginationParams & { organization?: number }): Promise<PaginatedResponse<DepartmentListItem>> => {
        const { data } = await apiClient.get('/departments/', { params })
        return data
    },

    get: async (id: number): Promise<Department> => {
        const { data } = await apiClient.get(`/departments/${id}/`)
        return data
    },

    create: async (payload: CreateDepartmentPayload): Promise<ApiResponse<Department>> => {
        const { data } = await apiClient.post('/departments/', payload)
        return data
    },

    update: async (id: number, payload: Partial<CreateDepartmentPayload>): Promise<ApiResponse<Department>> => {
        const { data } = await apiClient.patch(`/departments/${id}/`, payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/departments/${id}/`)
        return data
    },

    assignManager: async (id: number, managerId: number | null): Promise<ApiResponse<Department>> => {
        const { data } = await apiClient.post(`/departments/${id}/assign-manager/`, { manager_id: managerId })
        return data
    },
}
