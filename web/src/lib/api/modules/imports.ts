import apiClient from '../client'
import type { ApiResponse, ImportResult, ImportErrorResult } from '@/types'

export const importsApi = {
    uploadEntities: async (file: File, organizationId?: number): Promise<ApiResponse<ImportResult | ImportErrorResult>> => {
        const formData = new FormData()
        formData.append('file', file)
        if (organizationId) {
            formData.append('organization', String(organizationId))
        }
        const { data } = await apiClient.post('/bulk-import/entities/', formData, {
            headers: { 'Content-Type': undefined },
        })
        return data
    },

    uploadProcedures: async (file: File, organizationId?: number): Promise<ApiResponse<ImportResult | ImportErrorResult>> => {
        const formData = new FormData()
        formData.append('file', file)
        if (organizationId) {
            formData.append('organization', String(organizationId))
        }
        const { data } = await apiClient.post('/bulk-import/procedures/', formData, {
            headers: { 'Content-Type': undefined },
        })
        return data
    },

    downloadTemplate: async (type: 'entities' | 'procedures'): Promise<void> => {
        const { data } = await apiClient.get(`/bulk-import/templates/${type}/`, {
            responseType: 'blob',
        })
        const blob = new Blob([data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = type === 'entities' ? 'varlik_sablonu.xlsx' : 'prosedur_sablonu.xlsx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    },
}
