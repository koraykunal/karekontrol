'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { proceduresApi, procedureStepsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { procedureKeys } from '@/lib/query-keys'
import type { CreateProcedurePayload, CreateProcedureStepPayload } from '@/types'

export function useProcedures(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: procedureKeys.list(params),
        queryFn: () => proceduresApi.list(params),
    })
}

export function useProcedure(id: number, enabled = true) {
    return useQuery({
        queryKey: procedureKeys.detail(id),
        queryFn: () => proceduresApi.get(id),
        enabled: enabled && !isNaN(id),
    })
}

export function useProcedureOptions(entityId?: number) {
    return useQuery({
        queryKey: [...procedureKeys.all, 'options', entityId],
        queryFn: () => proceduresApi.list({ page_size: 200, ...(entityId ? { entity: entityId } : {}) }),
    })
}

export function useCreateProcedure(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateProcedurePayload) => proceduresApi.create(payload),
        onSuccess: () => {
            toast.success('Prosedür oluşturuldu')
            queryClient.invalidateQueries({ queryKey: procedureKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Prosedür oluşturulamadı'),
    })
}

export function useUpdateProcedure(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateProcedurePayload> & { is_active?: boolean } }) =>
            proceduresApi.update(id, payload),
        onSuccess: () => {
            toast.success('Prosedür güncellendi')
            queryClient.invalidateQueries({ queryKey: procedureKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Güncelleme başarısız'),
    })
}

export function useDeleteProcedure(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => proceduresApi.delete(id),
        onSuccess: () => {
            toast.success('Prosedür silindi')
            queryClient.invalidateQueries({ queryKey: procedureKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Silme işlemi başarısız'),
    })
}

export function useProcedureSteps(procedureId: number, enabled = true) {
    return useQuery({
        queryKey: [...procedureKeys.detail(procedureId), 'steps'],
        queryFn: () => proceduresApi.getSteps(procedureId),
        enabled: enabled && !isNaN(procedureId) && procedureId > 0,
    })
}

export function useAddProcedureStep(procedureId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: Omit<CreateProcedureStepPayload, 'procedure'>) =>
            procedureStepsApi.create({ ...payload, procedure: procedureId }),
        onSuccess: () => {
            toast.success('Adım eklendi')
            queryClient.invalidateQueries({ queryKey: [...procedureKeys.detail(procedureId), 'steps'] })
            queryClient.invalidateQueries({ queryKey: procedureKeys.lists() })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Adım eklenemedi'),
    })
}

export function useDeleteProcedureStep(options?: { onSuccess?: (procedureId?: number) => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id }: { id: number; procedureId: number }) => procedureStepsApi.delete(id),
        onSuccess: (_, { procedureId }) => {
            toast.success('Adım silindi')
            queryClient.invalidateQueries({ queryKey: [...procedureKeys.detail(procedureId), 'steps'] })
            queryClient.invalidateQueries({ queryKey: procedureKeys.lists() })
            options?.onSuccess?.(procedureId)
        },
        onError: (error) => handleApiError(error, 'Adım silinemedi'),
    })
}

export function useReorderSteps(procedureId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (step_orders: Array<{ id: number; order: number }>) =>
            proceduresApi.reorderSteps(procedureId, { step_orders }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...procedureKeys.detail(procedureId), 'steps'] })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Sıralama güncellenemedi'),
    })
}
