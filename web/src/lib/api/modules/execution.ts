import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, ProcedureLog, ProcedureLogListItem, StepLog, Reminder, StepReminder } from '@/types'

export const procedureLogsApi = {
    list: async (params?: PaginationParams & { organization?: number; entity?: number; procedure?: number; status?: string; user?: number }): Promise<PaginatedResponse<ProcedureLogListItem>> => {
        const { data } = await apiClient.get('/procedure-logs/', { params })
        return data
    },

    get: async (id: number): Promise<ProcedureLog> => {
        const { data } = await apiClient.get(`/procedure-logs/${id}/`)
        return data
    },

    create: async (payload: { procedure: number; entity: number; organization: number; notes?: string }): Promise<ApiResponse<ProcedureLog>> => {
        const { data } = await apiClient.post('/procedure-logs/', payload)
        return data
    },

    complete: async (id: number): Promise<ApiResponse<ProcedureLog>> => {
        const { data } = await apiClient.post(`/procedure-logs/${id}/complete/`)
        return data
    },

    cancel: async (id: number): Promise<ApiResponse<ProcedureLog>> => {
        const { data } = await apiClient.post(`/procedure-logs/${id}/cancel/`)
        return data
    },

    completeStep: async (logPk: number, stepId: number, payload: { completion_status: 'COMPLIANT' | 'NON_COMPLIANT'; notes?: string; photo_urls?: string[] }): Promise<ApiResponse<StepLog>> => {
        const { data } = await apiClient.post(`/procedure-logs/${logPk}/steps/${stepId}/complete/`, payload)
        return data
    },

    skipStep: async (logPk: number, stepId: number, payload: { reason?: string }): Promise<ApiResponse<StepLog>> => {
        const { data } = await apiClient.post(`/procedure-logs/${logPk}/steps/${stepId}/skip/`, payload)
        return data
    },
}

export const stepLogsApi = {
    list: async (params?: PaginationParams & { procedure_log?: number }): Promise<PaginatedResponse<StepLog>> => {
        const { data } = await apiClient.get('/step-logs/', { params })
        return data
    },

    get: async (id: number): Promise<StepLog> => {
        const { data } = await apiClient.get(`/step-logs/${id}/`)
        return data
    },
}

export const remindersApi = {
    list: async (params?: PaginationParams & { is_completed?: boolean }): Promise<PaginatedResponse<Reminder>> => {
        const { data } = await apiClient.get('/reminders/', { params })
        return data
    },

    create: async (payload: { title: string; description?: string; scheduled_for: string }): Promise<ApiResponse<Reminder>> => {
        const { data } = await apiClient.post('/reminders/', payload)
        return data
    },

    complete: async (id: number): Promise<ApiResponse<Reminder>> => {
        const { data } = await apiClient.post(`/reminders/${id}/complete/`)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/reminders/${id}/`)
        return data
    },
}

export const stepRemindersApi = {
    list: async (params?: PaginationParams): Promise<PaginatedResponse<StepReminder>> => {
        const { data } = await apiClient.get('/step-reminders/', { params })
        return data
    },

    create: async (payload: { step_log: number; procedure_log: number; remind_at: string; message: string }): Promise<ApiResponse<StepReminder>> => {
        const { data } = await apiClient.post('/step-reminders/', payload)
        return data
    },
}
