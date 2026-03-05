'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importsApi } from '@/lib/api'
import { entityKeys, procedureKeys } from '@/lib/query-keys'

export function useImportEntities(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ file, organizationId }: { file: File; organizationId?: number }) =>
            importsApi.uploadEntities(file, organizationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: entityKeys.all })
            options?.onSuccess?.()
        },
    })
}

export function useImportProcedures(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ file, organizationId }: { file: File; organizationId?: number }) =>
            importsApi.uploadProcedures(file, organizationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: procedureKeys.all })
            options?.onSuccess?.()
        },
    })
}
