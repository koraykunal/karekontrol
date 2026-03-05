import { apiClient } from '../client';
import type {
    Entity,
    EntityFilters,
    CreateEntityData,
    UpdateEntityData
} from '../types/entity.types';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';

export const entityEndpoints = {
    // ============ Entity CRUD ============
    getEntities: (params?: EntityFilters) =>
        apiClient.get<PaginatedResponse<Entity>>('/entities/', { params }),

    getEntity: (id: number) =>
        apiClient.get<ApiResponse<Entity>>(`/entities/${id}/`),

    createEntity: (data: CreateEntityData) =>
        apiClient.post<ApiResponse<Entity>>('/entities/', data),

    updateEntity: (id: number, data: UpdateEntityData) =>
        apiClient.patch<ApiResponse<Entity>>(`/entities/${id}/`, data),

    deleteEntity: (id: number) =>
        apiClient.delete<void>(`/entities/${id}/`),

    // ============ Utilities ============
    scanQr: (code: string) =>
        apiClient.get<ApiResponse<Entity>>(`/entities/scan/${code}/`),
};
