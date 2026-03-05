import apiClient from '../client'
import type { ApiResponse } from '@/types'

export interface DashboardStats {
    total_procedures: number
    total_assignments: number
    completed_assignments: number
    pending_assignments: number
    active_employees: number
    compliance_issues: number
}

export interface ManagerStats {
    team_size: number
    active_procedures: number
    completed_procedures_last_30_days: number
    pending_procedures: number
    compliance_rate: number
    open_issues: number
    resolved_issues: number
    department_name: string
}

export interface ActivityItem {
    id: number
    user_id: number
    user_name: string
    action: string
    resource_type: string
    resource_id: number | null
    details: string
    created_at: string
}

export const dashboardApi = {
    stats: async (params?: { organization?: number }): Promise<ApiResponse<DashboardStats>> => {
        const { data } = await apiClient.get('/dashboard/stats/', { params })
        return data
    },

    managerStats: async (): Promise<ApiResponse<ManagerStats>> => {
        const { data } = await apiClient.get('/dashboard/manager/stats/')
        return data
    },

    activity: async (params?: { limit?: number }): Promise<ApiResponse<ActivityItem[]>> => {
        const { data } = await apiClient.get('/dashboard/activity/', { params })
        return data
    },
}
