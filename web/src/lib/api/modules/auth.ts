import apiClient from './client'
import type { ApiResponse, ChangePasswordPayload } from '@/types'

export const authApi = {
    changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse<void>> => {
        const { data } = await apiClient.post('/auth/change-password/', payload)
        return data
    },
}
