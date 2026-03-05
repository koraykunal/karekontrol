import { issueEndpoints } from '../endpoints/issue.endpoints';
import type { NonComplianceIssue, HelpRequest, IssueFilters } from '../types/issue.types';

export const issueService = {
    // Issues
    getIssues: async (params?: IssueFilters) => {
        const response = await issueEndpoints.getIssues(params);
        return response.data;
    },

    getIssue: async (id: number) => {
        const response = await issueEndpoints.getIssue(id);
        return response.data;
    },

    createIssue: async (data: Partial<NonComplianceIssue>) => {
        const response = await issueEndpoints.createIssue(data);
        return response.data;
    },

    updateIssue: async (id: number, data: Partial<NonComplianceIssue>) => {
        const response = await issueEndpoints.updateIssue(id, data);
        return response.data;
    },

    resolveIssue: async (id: number, data: { resolution_notes: string; photo_evidence?: string }) => {
        const response = await issueEndpoints.resolveIssue(id, data);
        return response.data;
    },

    // Comments
    getIssueComments: async (issueId: number) => {
        const response = await issueEndpoints.getIssueComments(issueId);
        return response.data;
    },

    createIssueComment: async (issueId: number, content: string) => {
        const response = await issueEndpoints.createIssueComment(issueId, { content });
        return response.data;
    },

    // Help Requests
    getHelpRequests: async (params?: Record<string, unknown>) => {
        const response = await issueEndpoints.getHelpRequests(params);
        return response.data;
    },

    createHelpRequest: async (data: Partial<HelpRequest>) => {
        const response = await issueEndpoints.createHelpRequest(data);
        return response.data;
    },

    respondToHelpRequest: async (id: number, status: string, notes?: string) => {
        const response = await issueEndpoints.respondToHelpRequest(id, {
            status,
            response_notes: notes
        });
        return response.data;
    },
};
