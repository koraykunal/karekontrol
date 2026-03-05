import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';
import type {
    NonComplianceIssue,
    IssueComment,
    HelpRequest
} from '../types/issue.types';

export const issueEndpoints = {
    // Issues
    getIssues: (params?: any) =>
        apiClient.get<PaginatedResponse<NonComplianceIssue>>('/issues/', { params }),

    getIssue: (id: number) =>
        apiClient.get<ApiResponse<NonComplianceIssue>>(`/issues/${id}/`),

    createIssue: (data: Partial<NonComplianceIssue>) =>
        apiClient.post<ApiResponse<NonComplianceIssue>>('/issues/', data),

    updateIssue: (id: number, data: Partial<NonComplianceIssue>) =>
        apiClient.patch<ApiResponse<NonComplianceIssue>>(`/issues/${id}/`, data),

    resolveIssue: (id: number, data: { resolution_notes: string; photo_evidence?: string }) =>
        apiClient.post<ApiResponse<NonComplianceIssue>>(`/issues/${id}/resolve/`, data),

    // Comments
    getIssueComments: (issueId: number) =>
        apiClient.get<ApiResponse<IssueComment[]>>(`/issues/${issueId}/comments/`),

    createIssueComment: (issueId: number, data: { content: string }) =>
        apiClient.post<ApiResponse<IssueComment>>(`/issues/${issueId}/comments/`, data),

    // Help Requests
    getHelpRequests: (params?: any) =>
        apiClient.get<PaginatedResponse<HelpRequest>>('/help-requests/', { params }),

    createHelpRequest: (data: Partial<HelpRequest>) =>
        apiClient.post<ApiResponse<HelpRequest>>('/help-requests/', data),

    respondToHelpRequest: (id: number, data: { status: string; response_notes?: string }) =>
        apiClient.post<ApiResponse<HelpRequest>>(`/help-requests/${id}/respond/`, data),
};
