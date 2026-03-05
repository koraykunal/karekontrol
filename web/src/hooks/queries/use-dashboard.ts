'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'
import { dashboardKeys } from '@/lib/query-keys'

export function useDashboardStats() {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: async () => {
            const response = await dashboardApi.stats()
            return response.data ?? null
        },
    })
}

export function useManagerStats(enabled = true) {
    return useQuery({
        queryKey: dashboardKeys.managerStats(),
        queryFn: async () => {
            const response = await dashboardApi.managerStats()
            return response.data ?? null
        },
        enabled,
    })
}

export function useActivityFeed(limit = 15) {
    return useQuery({
        queryKey: [...dashboardKeys.activity(), limit],
        queryFn: async () => {
            const response = await dashboardApi.activity({ limit })
            return response.data ?? []
        },
    })
}
