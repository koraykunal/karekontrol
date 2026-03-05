'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usersApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { userKeys } from '@/lib/query-keys'
import type { AdminCreateUserPayload, UpdateUserPayload } from '@/types'
import type { UserRole } from '@/lib/constants'

export function useUsers(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => usersApi.list(params),
    })
}

export function useUser(id: number, enabled = true) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => usersApi.get(id),
        enabled: enabled && !isNaN(id),
    })
}

export function useCreateUser(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: AdminCreateUserPayload) => usersApi.create(payload),
        onSuccess: () => {
            toast.success('Kullanıcı oluşturuldu')
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Kullanıcı oluşturulamadı'),
    })
}

export function useUpdateUser(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
            usersApi.update(id, payload),
        onSuccess: () => {
            toast.success('Kullanıcı güncellendi')
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Güncelleme başarısız'),
    })
}

export function useUpdateUserRole(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, role }: { id: number; role: UserRole }) => usersApi.updateRole(id, role),
        onSuccess: () => {
            toast.success('Rol güncellendi')
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Rol güncellenemedi'),
    })
}

export function useToggleUserStatus(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
            if (isActive) {
                await usersApi.deactivate(id)
            } else {
                await usersApi.activate(id)
            }
        },
        onSuccess: () => {
            toast.success('Durum güncellendi')
            queryClient.invalidateQueries({ queryKey: userKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'İşlem başarısız'),
    })
}
