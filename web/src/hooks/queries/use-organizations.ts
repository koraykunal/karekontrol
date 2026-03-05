'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { organizationsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { organizationKeys } from '@/lib/query-keys'
import type { CreateOrganizationPayload, OnboardOrganizationPayload } from '@/types'

export function useOrganizations(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: organizationKeys.list(params),
        queryFn: () => organizationsApi.list(params),
    })
}

export function useOrganization(id: number, enabled = true) {
    return useQuery({
        queryKey: organizationKeys.detail(id),
        queryFn: () => organizationsApi.get(id),
        enabled: enabled && !isNaN(id),
    })
}

export function useOrganizationOptions() {
    return useQuery({
        queryKey: organizationKeys.select(),
        queryFn: () => organizationsApi.list({ page_size: 100 }),
    })
}

export function useCreateOrganization(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateOrganizationPayload) => organizationsApi.create(payload),
        onSuccess: () => {
            toast.success('Organizasyon oluşturuldu')
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Organizasyon oluşturulamadı'),
    })
}

export function useUpdateOrganization(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateOrganizationPayload> }) =>
            organizationsApi.update(id, payload),
        onSuccess: () => {
            toast.success('Organizasyon güncellendi')
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Güncelleme başarısız'),
    })
}

export function useOnboardOrganization(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: OnboardOrganizationPayload) => organizationsApi.onboard(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Onboarding başarısız'),
    })
}

export function useOrganizationQuota(orgId: number, enabled = true) {
    return useQuery({
        queryKey: organizationKeys.quota(orgId),
        queryFn: () => organizationsApi.getQuota(orgId),
        enabled: enabled && !isNaN(orgId) && orgId > 0,
    })
}

export function useUpdateQuota(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, qr_quota }: { id: number; qr_quota: number }) =>
            organizationsApi.update(id, { qr_quota }),
        onSuccess: () => {
            toast.success('Kota güncellendi')
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Kota güncellenemedi'),
    })
}

export function useResetSandbox(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, password }: { id: number; password: string }) =>
            organizationsApi.resetSandbox(id, password),
        onSuccess: () => {
            toast.success('Sandbox sıfırlandı ve demo veri yeniden oluşturuldu')
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Sandbox sıfırlama başarısız'),
    })
}

export function useToggleOrganizationStatus(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
            if (isActive) {
                await organizationsApi.deactivate(id)
            } else {
                await organizationsApi.activate(id)
            }
        },
        onSuccess: () => {
            toast.success('Durum güncellendi')
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'İşlem başarısız'),
    })
}
