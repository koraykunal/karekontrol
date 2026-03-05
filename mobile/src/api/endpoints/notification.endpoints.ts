import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';
import type {
    Notification,
    PushTokenRequest
} from '../types/notification.types';

export const notificationEndpoints = {
    // Notifications
    getNotifications: (params?: any) =>
        apiClient.get<PaginatedResponse<Notification>>('/notifications/', { params }),

    getUnreadCount: () =>
        apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count/'),

    markAsRead: (id: number) =>
        apiClient.post<ApiResponse<Notification>>(`/notifications/${id}/read/`),

    markAllAsRead: () =>
        apiClient.post<ApiResponse<void>>('/notifications/read-all/'),

    deleteNotification: (id: number) =>
        apiClient.delete<void>(`/notifications/${id}/`),

    // Push Tokens
    registerPushToken: (data: PushTokenRequest) =>
        apiClient.post<ApiResponse<void>>('/notifications/register-push-token/', data),

    // Preferences
    getPreferences: () =>
        apiClient.get<ApiResponse<any>>('/notifications/preferences/'),

    updatePreferences: (data: Record<string, any>) =>
        apiClient.patch<ApiResponse<any>>('/notifications/preferences/', data),
};
