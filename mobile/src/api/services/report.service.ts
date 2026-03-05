import { reportEndpoints } from '../endpoints/report.endpoints';
import type { Report } from '../types/report.types';

export const reportService = {
    getReports: async (params?: any) => {
        const response = await reportEndpoints.getReports(params);
        return response.data;
    },

    getReport: async (id: number) => {
        const response = await reportEndpoints.getReport(id);
        return response.data;
    },

    generateReport: async (reportType: string, parameters: any, title?: string) => {
        const response = await reportEndpoints.generateReport({
            report_type: reportType,
            parameters,
            title
        });
        return response.data;
    },

    deleteReport: async (id: number) => {
        await reportEndpoints.deleteReport(id);
    },

    // Scheduled
    getScheduledReports: async (params?: any) => {
        const response = await reportEndpoints.getScheduledReports(params);
        return response.data;
    },
};
