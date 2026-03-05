'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { procedureLogsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { executionKeys } from '@/lib/query-keys'

export function useProcedureLogs(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: executionKeys.list(params),
        queryFn: () => procedureLogsApi.list(params),
    })
}

export function useProcedureLog(id: number, enabled = true) {
    return useQuery({
        queryKey: executionKeys.detail(id),
        queryFn: () => procedureLogsApi.get(id),
        enabled: enabled && !isNaN(id) && id > 0,
    })
}

export function useCreateProcedureLog(options?: { onSuccess?: (id: number) => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: { procedure: number; entity: number; organization: number; notes?: string }) =>
            procedureLogsApi.create(payload),
        onSuccess: (res) => {
            toast.success('Yürütme başlatıldı')
            queryClient.invalidateQueries({ queryKey: executionKeys.all })
            options?.onSuccess?.(res.data.id)
        },
        onError: (error) => handleApiError(error, 'Yürütme başlatılamadı'),
    })
}

export function useCompleteProcedureLog(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => procedureLogsApi.complete(id),
        onSuccess: (_, id) => {
            toast.success('Yürütme tamamlandı')
            queryClient.invalidateQueries({ queryKey: executionKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: executionKeys.lists() })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Yürütme tamamlanamadı'),
    })
}

export function useCancelProcedureLog(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => procedureLogsApi.cancel(id),
        onSuccess: (_, id) => {
            toast.success('Yürütme iptal edildi')
            queryClient.invalidateQueries({ queryKey: executionKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: executionKeys.lists() })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'İptal işlemi başarısız'),
    })
}

export function useCompleteStep(logId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ stepId, completion_status, notes }: { stepId: number; completion_status: 'COMPLIANT' | 'NON_COMPLIANT'; notes?: string }) =>
            procedureLogsApi.completeStep(logId, stepId, { completion_status, notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: executionKeys.detail(logId) })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Adım tamamlanamadı'),
    })
}

export function useSkipStep(logId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ stepId, reason }: { stepId: number; reason?: string }) =>
            procedureLogsApi.skipStep(logId, stepId, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: executionKeys.detail(logId) })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Adım atlanamadı'),
    })
}
