import { permissionEndpoints } from '../endpoints/permission.endpoints';
import type {
    RolePermissionConfig,
    CreateRolePermissionConfigData,
    UpdateRolePermissionConfigData
} from '../endpoints/permission.endpoints';

export const permissionService = {
    getRoleConfigs: async (params?: { organization?: number; department?: number; role?: string }) => {
        const response = await permissionEndpoints.getRoleConfigs(params);
        return response.data;
    },

    getRoleConfig: async (id: number) => {
        const response = await permissionEndpoints.getRoleConfig(id);
        return response.data;
    },

    createRoleConfig: async (data: CreateRolePermissionConfigData) => {
        const response = await permissionEndpoints.createRoleConfig(data);
        return response.data;
    },

    updateRoleConfig: async (id: number, data: UpdateRolePermissionConfigData) => {
        const response = await permissionEndpoints.updateRoleConfig(id, data);
        return response.data;
    },

    saveRoleConfig: async (data: CreateRolePermissionConfigData) => {
        const response = await permissionEndpoints.saveRoleConfig(data);
        return response.data;
    },

    deleteRoleConfig: async (id: number) => {
        await permissionEndpoints.deleteRoleConfig(id);
    },
};

export type { RolePermissionConfig, CreateRolePermissionConfigData, UpdateRolePermissionConfigData };
