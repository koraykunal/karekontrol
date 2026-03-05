import { dashboardEndpoints } from '../endpoints/dashboard.endpoints';

export const dashboardService = {
    getStats: async () => {
        const response = await dashboardEndpoints.getStats();
        return response.data;
    },

    getManagerStats: async () => {
        const response = await dashboardEndpoints.getManagerStats();
        return response.data;
    },
};
