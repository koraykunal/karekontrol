import { organizationEndpoints } from '../endpoints/organization.endpoints';
import type { Organization, Department } from '../types/organization.types';

export const organizationService = {
    // Organization
    getOrganizations: async () => {
        const response = await organizationEndpoints.getOrganizations();
        return response.data;
    },

    getOrganization: async (id: number) => {
        const response = await organizationEndpoints.getOrganization(id);
        return response.data;
    },

    updateOrganization: async (id: number, data: Partial<Organization>) => {
        const response = await organizationEndpoints.updateOrganization(id, data);
        return response.data;
    },

    // Departments
    getDepartments: async (params?: any) => {
        const response = await organizationEndpoints.getDepartments(params);
        return response.data;
    },

    getDepartment: async (id: number) => {
        const response = await organizationEndpoints.getDepartment(id);
        return response.data;
    },

    createDepartment: async (data: Partial<Department>) => {
        const response = await organizationEndpoints.createDepartment(data);
        return response.data;
    },

    updateDepartment: async (id: number, data: Partial<Department>) => {
        const response = await organizationEndpoints.updateDepartment(id, data);
        return response.data;
    },

    deleteDepartment: async (id: number) => {
        await organizationEndpoints.deleteDepartment(id);
    },

};
