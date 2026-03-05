import { entityEndpoints } from '../endpoints/entity.endpoints';
import type { Entity, EntityFilters, CreateEntityData, UpdateEntityData } from '../types/entity.types';
import type { User } from '../types/auth.types';

/**
 * User context for permission-based filtering
 * Pass this from the component/hook layer, not accessed directly from store
 */
export interface UserContext {
    user: User | null;
}

export const entityService = {
    /**
     * Get entities with optional permission-based filtering
     * @param filters - Entity filters
     * @param userContext - Optional user context for permission filtering (passed from hooks)
     */
    getEntities: async (filters?: EntityFilters, userContext?: UserContext) => {
        const activeFilters = { ...filters };

        if (__DEV__) {
            const { logger } = require('../../utils/logger');
            logger.debug('[EntityService] Applied Filters:', JSON.stringify(activeFilters));
        }

        const response = await entityEndpoints.getEntities(activeFilters);
        return response.data;
    },

    getEntity: async (id: number) => {
        const response = await entityEndpoints.getEntity(id);
        return response.data;
    },

    createEntity: async (data: CreateEntityData) => {
        const response = await entityEndpoints.createEntity(data);
        return response.data;
    },

    updateEntity: async (id: number, data: UpdateEntityData) => {
        const response = await entityEndpoints.updateEntity(id, data);
        return response.data;
    },

    deleteEntity: async (id: number) => {
        await entityEndpoints.deleteEntity(id);
    },

    scanQr: async (code: string) => {
        const response = await entityEndpoints.scanQr(code);
        return response.data;
    },

    uploadImage: async (entityId: number, imageUri: string, isPrimary: boolean = true) => {
        const formData = new FormData();

        const uriParts = imageUri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

        formData.append('image', {
            uri: imageUri,
            name: fileName,
            type: fileType,
        } as any);

        formData.append('is_primary', isPrimary.toString());

        const { apiClient } = require('../client');
        const response = await apiClient.post(`/entities/${entityId}/upload-image/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            transformRequest: (data: any) => data,
        });

        return response.data;
    },
};
