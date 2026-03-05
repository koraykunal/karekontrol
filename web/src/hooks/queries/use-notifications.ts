'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notificationsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { notificationKeys } from '@/lib/query-keys'

export function useNotifications(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: notificationKeys.list(params),
        queryFn: () => notificationsApi.list(params),
    })
}

export function useNotificationUnreadCount() {
    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: async () => {
            const response = await notificationsApi.unreadCount()
            return { count: response.count ?? 0 }
        },
        refetchInterval: 60000,
        refetchIntervalInBackground: false,
    })
}

export function useMarkNotificationRead(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => notificationsApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Bildirim okundu olarak işaretlenemedi'),
    })
}

export function useMarkAllNotificationsRead(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onSuccess: () => {
            toast.success('Tüm bildirimler okundu olarak işaretlendi')
            queryClient.invalidateQueries({ queryKey: notificationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'İşlem başarısız'),
    })
}

export function useSendSystemNotification(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: Parameters<typeof notificationsApi.sendSystem>[0]) =>
            notificationsApi.sendSystem(payload),
        onSuccess: () => {
            toast.success('Bildirim gönderildi')
            queryClient.invalidateQueries({ queryKey: notificationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Bildirim gönderilemedi'),
    })
}
