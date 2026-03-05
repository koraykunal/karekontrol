'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { entitiesApi, entityImagesApi, entityDocumentsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { entityKeys } from '@/lib/query-keys'
import type { CreateEntityPayload, UpdateEntityPayload } from '@/types'

export function useEntities(params: Record<string, unknown> = {}, enabled = true) {
    return useQuery({
        queryKey: entityKeys.list(params),
        queryFn: () => entitiesApi.list(params),
        enabled,
    })
}

export function useEntity(id: number, enabled = true) {
    return useQuery({
        queryKey: entityKeys.detail(id),
        queryFn: () => entitiesApi.get(id),
        enabled: enabled && !isNaN(id),
    })
}

export function useCreateEntity(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateEntityPayload) => entitiesApi.create(payload),
        onSuccess: () => {
            toast.success('Varlık oluşturuldu')
            queryClient.invalidateQueries({ queryKey: entityKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Varlık oluşturulamadı'),
    })
}

export function useUpdateEntity(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateEntityPayload }) =>
            entitiesApi.update(id, payload),
        onSuccess: () => {
            toast.success('Varlık güncellendi')
            queryClient.invalidateQueries({ queryKey: entityKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Güncelleme başarısız'),
    })
}

export function useDeleteEntity(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => entitiesApi.delete(id),
        onSuccess: () => {
            toast.success('Varlık silindi')
            queryClient.invalidateQueries({ queryKey: entityKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Silme işlemi başarısız'),
    })
}

export function useEntityImages(entityId: number, enabled = true) {
    return useQuery({
        queryKey: [...entityKeys.detail(entityId), 'images'],
        queryFn: () => entityImagesApi.list({ entity: entityId }),
        enabled: enabled && !isNaN(entityId) && entityId > 0,
    })
}

export function useEntityDocuments(entityId: number, enabled = true) {
    return useQuery({
        queryKey: [...entityKeys.detail(entityId), 'documents'],
        queryFn: () => entityDocumentsApi.list({ entity: entityId }),
        enabled: enabled && !isNaN(entityId) && entityId > 0,
    })
}

export function useEntityHistory(entityId: number, params: Record<string, unknown> = {}, enabled = true) {
    return useQuery({
        queryKey: [...entityKeys.detail(entityId), 'history', params],
        queryFn: () => entitiesApi.history(entityId, params),
        enabled: enabled && !isNaN(entityId) && entityId > 0,
    })
}

export function useUploadEntityImage(entityId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (formData: FormData) => entityImagesApi.upload(entityId, formData),
        onSuccess: () => {
            toast.success('Görsel yüklendi')
            queryClient.invalidateQueries({ queryKey: [...entityKeys.detail(entityId), 'images'] })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Görsel yüklenemedi'),
    })
}

export function useDeleteEntityImage(entityId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => entityImagesApi.delete(id),
        onSuccess: () => {
            toast.success('Görsel silindi')
            queryClient.invalidateQueries({ queryKey: [...entityKeys.detail(entityId), 'images'] })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Görsel silinemedi'),
    })
}

export function useSetPrimaryImage(entityId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => entityImagesApi.setPrimary(id),
        onSuccess: () => {
            toast.success('Birincil görsel güncellendi')
            queryClient.invalidateQueries({ queryKey: [...entityKeys.detail(entityId), 'images'] })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'İşlem başarısız'),
    })
}

export function useUploadEntityDocument(entityId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (formData: FormData) => entityDocumentsApi.upload(entityId, formData),
        onSuccess: () => {
            toast.success('Doküman yüklendi')
            queryClient.invalidateQueries({ queryKey: [...entityKeys.detail(entityId), 'documents'] })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Doküman yüklenemedi'),
    })
}

export function useDeleteEntityDocument(entityId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => entityDocumentsApi.delete(id),
        onSuccess: () => {
            toast.success('Doküman silindi')
            queryClient.invalidateQueries({ queryKey: [...entityKeys.detail(entityId), 'documents'] })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Doküman silinemedi'),
    })
}
