import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, Entity, EntityListItem, EntityImage, EntityDocument, EntityShare, CreateEntityPayload, UpdateEntityPayload, ProcedureLogListItem } from '@/types'

export const entitiesApi = {
    list: async (params?: PaginationParams & { organization?: number; department?: number; entity_type?: string; status?: string }): Promise<PaginatedResponse<EntityListItem>> => {
        const { data } = await apiClient.get('/entities/', { params })
        return data
    },

    get: async (id: number): Promise<Entity> => {
        const { data } = await apiClient.get(`/entities/${id}/`)
        return data
    },

    create: async (payload: CreateEntityPayload): Promise<ApiResponse<Entity>> => {
        const { data } = await apiClient.post('/entities/', payload)
        return data
    },

    update: async (id: number, payload: UpdateEntityPayload): Promise<ApiResponse<Entity>> => {
        const { data } = await apiClient.patch(`/entities/${id}/`, payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/entities/${id}/`)
        return data
    },

    history: async (id: number, params?: PaginationParams): Promise<PaginatedResponse<ProcedureLogListItem>> => {
        const { data } = await apiClient.get(`/entities/${id}/history/`, { params })
        return data
    },
}

export const entityImagesApi = {
    list: async (params?: PaginationParams & { entity?: number }): Promise<PaginatedResponse<EntityImage>> => {
        const { data } = await apiClient.get('/entity-images/', { params })
        return data
    },

    upload: async (entityId: number, formData: FormData): Promise<ApiResponse<EntityImage>> => {
        const { data } = await apiClient.post(`/entities/${entityId}/upload-image/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    create: async (formData: FormData): Promise<ApiResponse<EntityImage>> => {
        const { data } = await apiClient.post('/entity-images/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    setPrimary: async (id: number): Promise<ApiResponse<EntityImage>> => {
        const { data } = await apiClient.post(`/entity-images/${id}/set-primary/`)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/entity-images/${id}/`)
        return data
    },
}

export const entityDocumentsApi = {
    list: async (params?: PaginationParams & { entity?: number }): Promise<PaginatedResponse<EntityDocument>> => {
        const { data } = await apiClient.get('/entity-documents/', { params })
        return data
    },

    upload: async (entityId: number, formData: FormData): Promise<ApiResponse<EntityDocument>> => {
        const { data } = await apiClient.post(`/entities/${entityId}/upload-document/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    create: async (formData: FormData): Promise<ApiResponse<EntityDocument>> => {
        const { data } = await apiClient.post('/entity-documents/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/entity-documents/${id}/`)
        return data
    },
}

export const entitySharesApi = {
    list: async (params?: PaginationParams & { entity?: number; shared_with_department?: number }): Promise<PaginatedResponse<EntityShare>> => {
        const { data } = await apiClient.get('/entity-shares/', { params })
        return data
    },

    create: async (payload: { entity: number; shared_with_department: number; reason?: string; expires_at?: string }): Promise<ApiResponse<EntityShare>> => {
        const { data } = await apiClient.post('/entity-shares/', payload)
        return data
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.delete(`/entity-shares/${id}/`)
        return data
    },
}
