import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, Report, ReportListItem, ReportSchedule } from '@/types'

export const reportsApi = {
    list: async (params?: PaginationParams & { organization?: number; department?: number; report_type?: string; status?: string }): Promise<PaginatedResponse<ReportListItem>> => {
        const { data } = await apiClient.get('/reports/', { params })
        return data
    },

    get: async (id: number): Promise<Report> => {
        const { data } = await apiClient.get(`/reports/${id}/`)
        return data
    },

    generate: async (payload: { department?: number; report_type: string; period_month: number; period_year: number; title?: string }): Promise<ApiResponse<Report>> => {
        const { data } = await apiClient.post('/reports/', payload)
        return data
    },

    download: async (id: number): Promise<Blob> => {
        const response = await apiClient.get(`/reports/${id}/download/`, {
            responseType: 'blob',
        })
        return response.data
    },

    generateProcedureReport: async (procedureLogId: number): Promise<ApiResponse<Report>> => {
        const { data } = await apiClient.post('/reports/generate-procedure-report/', {
            procedure_log_id: procedureLogId,
        })
        return data
    },
}

export const reportSchedulesApi = {
    list: async (params?: PaginationParams & { organization?: number; is_active?: boolean }): Promise<PaginatedResponse<ReportSchedule>> => {
        const { data } = await apiClient.get('/schedules/', { params })
        return data
    },

    get: async (id: number): Promise<ReportSchedule> => {
        const { data } = await apiClient.get(`/schedules/${id}/`)
        return data
    },

    create: async (payload: Partial<ReportSchedule>): Promise<ApiResponse<ReportSchedule>> => {
        const { data } = await apiClient.post('/schedules/', payload)
        return data
    },

    update: async (id: number, payload: Partial<ReportSchedule>): Promise<ApiResponse<ReportSchedule>> => {
        const { data } = await apiClient.patch(`/schedules/${id}/`, payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/schedules/${id}/`)
        return data
    },
}
