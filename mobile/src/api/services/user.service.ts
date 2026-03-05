import { userEndpoints, UserFilters, CreateUserData, UpdateUserData } from '../endpoints/user.endpoints';
import { UserRole } from '../types/enums';

export const userService = {
    getUsers: async (params?: UserFilters) => {
        const response = await userEndpoints.getUsers(params);
        return response.data;
    },

    getUser: async (id: number) => {
        const response = await userEndpoints.getUser(id);
        return response.data;
    },

    getUsersByDepartment: async (departmentId: number) => {
        const response = await userEndpoints.getUsersByDepartment(departmentId);
        return response.data;
    },

    createUser: async (data: CreateUserData) => {
        const response = await userEndpoints.createUser(data);
        return response.data;
    },

    updateUser: async (id: number, data: UpdateUserData) => {
        const response = await userEndpoints.updateUser(id, data);
        return response.data;
    },

    updateRole: async (id: number, role: UserRole) => {
        const response = await userEndpoints.updateRole(id, role);
        return response.data;
    },

    activateUser: async (id: number) => {
        const response = await userEndpoints.activateUser(id);
        return response.data;
    },

    deactivateUser: async (id: number) => {
        await userEndpoints.deactivateUser(id);
    },
};
