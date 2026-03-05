import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, ProcedureAssignment, PermissionPolicy } from '@/types'

export const procedureAssignmentsApi = {
    list: async (params?: PaginationParams & { procedure?: number; assigned_to_user?: number; status?: string }): Promise<PaginatedResponse<ProcedureAssignment>> => {
        const { data } = await apiClient.get('/permissions/procedure-assignments/', { params })
        return data
    },

    get: async (id: number): Promise<ProcedureAssignment> => {
        const { data } = await apiClient.get(`/permissions/procedure-assignments/${id}/`)
        return data
    },

    create: async (payload: { procedure: number; assigned_to_user: number; valid_from: string; valid_until?: string; assignment_reason?: string; assignment_notes?: string; recurring?: boolean }): Promise<ApiResponse<ProcedureAssignment>> => {
        const { data } = await apiClient.post('/permissions/procedure-assignments/', payload)
        return data
    },

    update: async (id: number, payload: Partial<ProcedureAssignment>): Promise<ApiResponse<ProcedureAssignment>> => {
        const { data } = await apiClient.patch(`/permissions/procedure-assignments/${id}/`, payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/permissions/procedure-assignments/${id}/`)
        return data
    },
}

export const permissionPoliciesApi = {
    list: async (params?: PaginationParams & { organization?: number; department?: number; role?: string; is_active?: boolean }): Promise<PaginatedResponse<PermissionPolicy>> => {
        const { data } = await apiClient.get('/permissions/policies/', { params })
        return data
    },

    get: async (id: number): Promise<PermissionPolicy> => {
        const { data } = await apiClient.get(`/permissions/policies/${id}/`)
        return data
    },

    create: async (payload: Partial<PermissionPolicy>): Promise<ApiResponse<PermissionPolicy>> => {
        const { data } = await apiClient.post('/permissions/policies/', payload)
        return data
    },

    update: async (id: number, payload: Partial<PermissionPolicy>): Promise<ApiResponse<PermissionPolicy>> => {
        const { data } = await apiClient.patch(`/permissions/policies/${id}/`, payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/permissions/policies/${id}/`)
        return data
    },
}
