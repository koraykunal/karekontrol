'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { reportsApi, reportSchedulesApi } from '@/lib/api'
import { handleApiError } from '@/lib/utils'
import { reportKeys } from '@/lib/query-keys'
import type { ApiResponse, Report } from '@/types'

export function useReports(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: reportKeys.list(params),
        queryFn: () => reportsApi.list(params),
    })
}

export function useReport(id: number) {
    return useQuery({
        queryKey: reportKeys.detail(id),
        queryFn: () => reportsApi.get(id),
        enabled: !isNaN(id) && id > 0,
        refetchInterval: (query) => {
            const report = query.state.data as Report | undefined
            if (report?.status === 'PENDING' || report?.status === 'GENERATING') {
                return 3000
            }
            return false
        },
    })
}

export function useReportSchedules(params: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: [...reportKeys.schedules(), params] as const,
        queryFn: () => reportSchedulesApi.list(params),
    })
}

export function useCreateReport(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: { department?: number; report_type: string; period_month: number; period_year: number; title?: string }) =>
            reportsApi.generate(payload),
        onSuccess: () => {
            toast.success('Rapor oluşturma başlatıldı')
            queryClient.invalidateQueries({ queryKey: reportKeys.lists() })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Rapor oluşturulamadı'),
    })
}

export function useGenerateProcedureReport(options?: { onSuccess?: (report: Report) => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (procedureLogId: number) =>
            reportsApi.generateProcedureReport(procedureLogId),
        onSuccess: (res) => {
            toast.success('Rapor oluşturma başlatıldı')
            queryClient.invalidateQueries({ queryKey: reportKeys.lists() })
            const response = res as ApiResponse<Report>
            options?.onSuccess?.(response.data)
        },
        onError: (error) => handleApiError(error, 'Rapor oluşturulamadı'),
    })
}

export function useCreateReportSchedule(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: Parameters<typeof reportSchedulesApi.create>[0]) =>
            reportSchedulesApi.create(payload),
        onSuccess: () => {
            toast.success('Zamanlama oluşturuldu')
            queryClient.invalidateQueries({ queryKey: reportKeys.schedules() })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Zamanlama oluşturulamadı'),
    })
}

export function useDeleteReportSchedule(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: number) => reportSchedulesApi.delete(id),
        onSuccess: () => {
            toast.success('Zamanlama silindi')
            queryClient.invalidateQueries({ queryKey: reportKeys.schedules() })
            options?.onSuccess?.()
        },
        onError: (error) => handleApiError(error, 'Silme işlemi başarısız'),
    })
}
