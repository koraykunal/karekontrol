import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';
import type { Report } from '../types/report.types';

export const reportEndpoints = {
    getReports: (params?: any) =>
        apiClient.get<PaginatedResponse<Report>>('/reports/', { params }),

    getReport: (id: number) =>
        apiClient.get<Report>(`/reports/${id}/`),

    generateProcedureReport: (procedureLogId: number) =>
        apiClient.post<ApiResponse<Report>>('/reports/generate-procedure-report/', {
            procedure_log_id: procedureLogId,
        }),
};
