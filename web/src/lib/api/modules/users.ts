import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, User, UserListItem, AdminCreateUserPayload, UpdateUserPayload } from '@/types'
import type { UserRole } from '@/lib/constants'

export const usersApi = {
    list: async (params?: PaginationParams & { role?: UserRole; is_active?: boolean; organization?: number; department?: number }): Promise<PaginatedResponse<UserListItem>> => {
        const { data } = await apiClient.get('/users/', { params })
        return data
    },

    get: async (id: number): Promise<User> => {
        const { data } = await apiClient.get(`/users/${id}/`)
        return data
    },

    create: async (payload: AdminCreateUserPayload): Promise<ApiResponse<User>> => {
        const { data } = await apiClient.post('/users/', payload)
        return data
    },

    update: async (id: number, payload: UpdateUserPayload): Promise<ApiResponse<User>> => {
        const { data } = await apiClient.patch(`/users/${id}/`, payload)
        return data
    },

    deactivate: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/users/${id}/`)
        return data
    },

    activate: async (id: number): Promise<ApiResponse<User>> => {
        const { data } = await apiClient.post(`/users/${id}/activate/`)
        return data
    },

    updateRole: async (id: number, role: UserRole): Promise<ApiResponse<User>> => {
        const { data } = await apiClient.put(`/users/${id}/role/`, { role })
        return data
    },

    byDepartment: async (departmentId: number, params?: PaginationParams): Promise<PaginatedResponse<UserListItem>> => {
        const { data } = await apiClient.get(`/users/department/${departmentId}/`, { params })
        return data
    },
}
