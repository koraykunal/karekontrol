import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, Procedure, ProcedureListItem, ProcedureStep, ProcedureTemplate, CreateProcedurePayload, CreateProcedureStepPayload } from '@/types'

export const proceduresApi = {
    list: async (params?: PaginationParams & { organization?: number; entity?: number; priority?: string; is_active?: boolean }): Promise<PaginatedResponse<ProcedureListItem>> => {
        const { data } = await apiClient.get('/procedures/', { params })
        return data
    },

    get: async (id: number): Promise<Procedure> => {
        const { data } = await apiClient.get(`/procedures/${id}/`)
        return data
    },

    create: async (payload: CreateProcedurePayload): Promise<ApiResponse<Procedure>> => {
        const { data } = await apiClient.post('/procedures/', payload)
        return data
    },

    update: async (id: number, payload: Partial<CreateProcedurePayload>): Promise<ApiResponse<Procedure>> => {
        const { data } = await apiClient.patch(`/procedures/${id}/`, payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/procedures/${id}/`)
        return data
    },

    getSteps: async (id: number): Promise<ProcedureStep[]> => {
        const { data } = await apiClient.get(`/procedures/${id}/steps/`)
        return (data as ApiResponse<ProcedureStep[]>).data
    },

    reorderSteps: async (id: number, payload: { step_orders: Array<{ id: number; order: number }> }): Promise<ApiResponse<ProcedureStep[]>> => {
        const { data } = await apiClient.post(`/procedures/${id}/reorder-steps/`, payload)
        return data
    },
}

export const procedureStepsApi = {
    list: async (params?: PaginationParams & { procedure?: number }): Promise<PaginatedResponse<ProcedureStep>> => {
        const { data } = await apiClient.get('/procedure-steps/', { params })
        return data
    },

    get: async (id: number): Promise<ProcedureStep> => {
        const { data } = await apiClient.get(`/procedure-steps/${id}/`)
        return data
    },

    create: async (payload: CreateProcedureStepPayload): Promise<ApiResponse<ProcedureStep>> => {
        const { data } = await apiClient.post('/procedure-steps/', payload)
        return data
    },

    update: async (id: number, payload: Partial<CreateProcedureStepPayload>): Promise<ApiResponse<ProcedureStep>> => {
        const { data } = await apiClient.patch(`/procedure-steps/${id}/`, payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/procedure-steps/${id}/`)
        return data
    },
}

export const procedureTemplatesApi = {
    list: async (params?: PaginationParams & { organization?: number; category?: string; is_public?: boolean }): Promise<PaginatedResponse<ProcedureTemplate>> => {
        const { data } = await apiClient.get('/procedure-templates/', { params })
        return data
    },

    get: async (id: number): Promise<ProcedureTemplate> => {
        const { data } = await apiClient.get(`/procedure-templates/${id}/`)
        return data
    },

    create: async (payload: { organization: number; name: string; description?: string; category?: string; template_data: Record<string, unknown>; is_public?: boolean }): Promise<ApiResponse<ProcedureTemplate>> => {
        const { data } = await apiClient.post('/procedure-templates/', payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/procedure-templates/${id}/`)
        return data
    },
}
