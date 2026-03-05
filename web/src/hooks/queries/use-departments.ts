'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { departmentsApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { departmentKeys, organizationKeys } from '@/lib/query-keys'
import type { CreateDepartmentPayload } from '@/types'

export function useDepartments(orgId: number) {
    return useQuery({
        queryKey: departmentKeys.byOrg(orgId),
        queryFn: () => departmentsApi.list({ organization: orgId, page_size: 100 }),
        enabled: !!orgId,
    })
}

export function useDepartment(id: number, enabled = true) {
    return useQuery({
        queryKey: departmentKeys.detail(id),
        queryFn: () => departmentsApi.get(id),
        enabled: enabled && !isNaN(id),
    })
}

export function useDepartmentOptions(orgId?: number) {
    return useQuery({
        queryKey: departmentKeys.select(orgId),
        queryFn: () => departmentsApi.list({ organization: orgId, page_size: 100 }),
        enabled: !!orgId,
    })
}

export function useCreateDepartment(orgId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateDepartmentPayload) => departmentsApi.create(payload),
        onSuccess: () => {
            toast.success('Departman oluşturuldu')
            queryClient.invalidateQueries({ queryKey: departmentKeys.byOrg(orgId) })
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Departman oluşturulamadı'),
    })
}

export function useUpdateDepartment(orgId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateDepartmentPayload> }) =>
            departmentsApi.update(id, payload),
        onSuccess: () => {
            toast.success('Departman güncellendi')
            queryClient.invalidateQueries({ queryKey: departmentKeys.byOrg(orgId) })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Güncelleme başarısız'),
    })
}

export function useDeleteDepartment(orgId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => departmentsApi.delete(id),
        onSuccess: () => {
            toast.success('Departman silindi')
            queryClient.invalidateQueries({ queryKey: departmentKeys.byOrg(orgId) })
            queryClient.invalidateQueries({ queryKey: organizationKeys.all })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Silme işlemi başarısız'),
    })
}
