import apiClient from '../client'
import type { ApiResponse, PaginatedResponse, PaginationParams, NonComplianceIssue, IssueListItem, IssueComment, HelpRequest, CreateIssuePayload } from '@/types'

export const issuesApi = {
    list: async (params?: PaginationParams & { entity?: number; status?: string; severity?: string; assigned_to_department?: number; assigned_to_user?: number }): Promise<PaginatedResponse<IssueListItem>> => {
        const { data } = await apiClient.get('/issues/', { params })
        return data
    },

    get: async (id: number): Promise<NonComplianceIssue> => {
        const { data } = await apiClient.get(`/issues/${id}/`)
        return data
    },

    create: async (payload: CreateIssuePayload): Promise<ApiResponse<NonComplianceIssue>> => {
        const { data } = await apiClient.post('/issues/', payload)
        return data
    },

    update: async (id: number, payload: Partial<CreateIssuePayload>): Promise<ApiResponse<NonComplianceIssue>> => {
        const { data } = await apiClient.patch(`/issues/${id}/`, payload)
        return data
    },

    resolve: async (id: number, payload: { resolved_notes: string; resolution_photo_urls?: string[] }): Promise<ApiResponse<NonComplianceIssue>> => {
        const { data } = await apiClient.post(`/issues/${id}/resolve/`, payload)
        return data
    },

    assign: async (id: number, payload: { assigned_to_department?: number; assigned_to_user?: number }): Promise<ApiResponse<NonComplianceIssue>> => {
        const { data } = await apiClient.post(`/issues/${id}/assign/`, payload)
        return data
    },

    comments: async (issueId: number, params?: PaginationParams): Promise<PaginatedResponse<IssueComment>> => {
        const { data } = await apiClient.get(`/issues/${issueId}/comments/`, { params })
        return data
    },

    addComment: async (issueId: number, payload: { content: string; attachments?: string[]; is_internal?: boolean }): Promise<ApiResponse<IssueComment>> => {
        const { data } = await apiClient.post(`/issues/${issueId}/comments/`, payload)
        return data
    },
}

export const helpRequestsApi = {
    list: async (params?: PaginationParams & { status?: string; to_department?: number; from_department?: number }): Promise<PaginatedResponse<HelpRequest>> => {
        const { data } = await apiClient.get('/help-requests/', { params })
        return data
    },

    get: async (id: number): Promise<HelpRequest> => {
        const { data } = await apiClient.get(`/help-requests/${id}/`)
        return data
    },

    create: async (payload: { issue: number; to_department: number; message: string; target_user?: number }): Promise<ApiResponse<HelpRequest>> => {
        const { data } = await apiClient.post('/help-requests/', payload)
        return data
    },

    respond: async (id: number, payload: { status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED'; response_message?: string }): Promise<ApiResponse<HelpRequest>> => {
        const { data } = await apiClient.post(`/help-requests/${id}/respond/`, payload)
        return data
    },
}
