import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, Notification } from '@/types'

export const notificationsApi = {
    list: async (params?: PaginationParams & { is_read?: boolean; type?: string }): Promise<PaginatedResponse<Notification>> => {
        const { data } = await apiClient.get('/notifications/', { params })
        return data
    },

    get: async (id: number): Promise<Notification> => {
        const { data } = await apiClient.get(`/notifications/${id}/`)
        return data
    },

    markAsRead: async (id: number): Promise<ApiResponse<Notification>> => {
        const { data } = await apiClient.post(`/notifications/${id}/read/`)
        return data
    },

    markAllAsRead: async (): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.post('/notifications/read-all/')
        return data
    },

    unreadCount: async (): Promise<{ success: boolean; count: number }> => {
        const { data } = await apiClient.get('/notifications/unread-count/')
        return data
    },

    sendSystem: async (payload: {
        title: string
        message: string
        priority: string
        target: string
        department_id?: number
        user_ids?: number[]
        action_url?: string
    }): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.post('/notifications/send-system/', payload)
        return data
    },
}
