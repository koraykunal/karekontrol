import axios from 'axios'
import { useAuthStore } from '@/store/auth'

const apiClient = axios.create({
    baseURL: '/api/proxy',
    headers: {
        'Content-Type': 'application/json',
    },
})

let refreshPromise: Promise<void> | null = null

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            if (!refreshPromise) {
                refreshPromise = axios
                    .post('/api/auth/refresh')
                    .then(() => {})
                    .catch((refreshError) => {
                        useAuthStore.getState().logout()
                        if (typeof window !== 'undefined') {
                            window.location.href = '/login'
                        }
                        throw refreshError
                    })
                    .finally(() => {
                        refreshPromise = null
                    })
            }

            try {
                await refreshPromise
                return apiClient(originalRequest)
            } catch (refreshError) {
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient
