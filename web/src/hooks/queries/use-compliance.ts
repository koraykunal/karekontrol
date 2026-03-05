'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { issuesApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { complianceKeys } from '@/lib/query-keys'
import type { CreateIssuePayload } from '@/types'

export function useIssues(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: complianceKeys.list(params),
        queryFn: () => issuesApi.list(params),
    })
}

export function useIssue(id: number, enabled = true) {
    return useQuery({
        queryKey: complianceKeys.detail(id),
        queryFn: () => issuesApi.get(id),
        enabled: enabled && id > 0 && !isNaN(id),
    })
}

export function useCreateIssue(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateIssuePayload) => issuesApi.create(payload),
        onSuccess: () => {
            toast.success('Uyumsuzluk oluşturuldu')
            queryClient.invalidateQueries({ queryKey: complianceKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Uyumsuzluk oluşturulamadı'),
    })
}

export function useUpdateIssue(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateIssuePayload> & { assigned_to_department?: number | null; assigned_to_user?: number | null; due_date?: string | null } }) =>
            issuesApi.update(id, payload),
        onSuccess: () => {
            toast.success('Uyumsuzluk güncellendi')
            queryClient.invalidateQueries({ queryKey: complianceKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Güncelleme başarısız'),
    })
}

export function useResolveIssue(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, resolved_notes }: { id: number; resolved_notes: string }) =>
            issuesApi.resolve(id, { resolved_notes }),
        onSuccess: () => {
            toast.success('Uyumsuzluk çözüme kavuşturuldu')
            queryClient.invalidateQueries({ queryKey: complianceKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Çözümleme başarısız'),
    })
}

export function useIssueComments(issueId: number, enabled = true) {
    return useQuery({
        queryKey: complianceKeys.comments(issueId),
        queryFn: () => issuesApi.comments(issueId),
        enabled: enabled && !isNaN(issueId) && issueId > 0,
    })
}

export function useAddIssueComment(issueId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: { content: string }) => issuesApi.addComment(issueId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: complianceKeys.comments(issueId) })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Yorum gönderilemedi'),
    })
}
