import { apiClient } from '../client';
import type { ApiResponse } from '../types/common.types';
import type { DashboardStats, ManagerStats } from '../types/dashboard.types';

export const dashboardEndpoints = {
    getStats: () =>
        apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats/'),

    getManagerStats: () =>
        apiClient.get<ApiResponse<ManagerStats>>('/dashboard/manager/stats/'),
};
