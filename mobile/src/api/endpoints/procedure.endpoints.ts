import { apiClient } from '../client';
import type { ApiResponse, PaginatedResponse } from '../types/common.types';
import type {
    Procedure,
    ProcedureLog,
    ProcedureStep,
    ProcedureFilters,
    ProcedureLogFilters,
    StepLog,
    CompleteProcedureData,
    CompleteStepData,
    CreateProcedureData,
    UpdateProcedureData,
    CreateStepData,
    UpdateStepData
} from '../types/procedure.types';

export const procedureEndpoints = {
    // ============ Procedures ============
    getProcedures: (params?: ProcedureFilters) =>
        apiClient.get<PaginatedResponse<Procedure>>('/procedures/', { params }),

    getProcedure: (id: number) =>
        apiClient.get<ApiResponse<Procedure>>(`/procedures/${id}/`),

    createProcedure: (data: CreateProcedureData) =>
        apiClient.post<ApiResponse<Procedure>>('/procedures/', data),

    updateProcedure: (id: number, data: UpdateProcedureData) =>
        apiClient.patch<ApiResponse<Procedure>>(`/procedures/${id}/`, data),

    deleteProcedure: (id: number) =>
        apiClient.delete<void>(`/procedures/${id}/`),

    activateProcedure: (id: number) =>
        apiClient.post<ApiResponse<Procedure>>(`/procedures/${id}/activate/`),

    deactivateProcedure: (id: number) =>
        apiClient.post<ApiResponse<Procedure>>(`/procedures/${id}/deactivate/`),

    // ============ Procedure Steps ============
    getSteps: (procedureId: number) =>
        apiClient.get<ApiResponse<ProcedureStep[]>>(`/procedures/${procedureId}/steps/`),

    createStep: (procedureId: number, data: CreateStepData) =>
        apiClient.post<ApiResponse<ProcedureStep>>(`/procedures/${procedureId}/add-step/`, data),

    updateStep: (stepId: number, data: UpdateStepData) =>
        apiClient.patch<ApiResponse<ProcedureStep>>(`/procedure-steps/${stepId}/`, data),

    deleteStep: (stepId: number) =>
        apiClient.delete<void>(`/procedure-steps/${stepId}/`),

    reorderSteps: (procedureId: number, stepOrders: { id: number; order: number }[]) =>
        apiClient.post<ApiResponse<ProcedureStep[]>>(`/procedures/${procedureId}/reorder-steps/`, { step_orders: stepOrders }),

    // ============ Procedure Logs (Execution) ============
    getProcedureLogs: (params?: ProcedureLogFilters) =>
        apiClient.get<PaginatedResponse<ProcedureLog>>('/procedure-logs/', { params }),

    getProcedureLog: (id: number) => apiClient.get<ApiResponse<ProcedureLog>>(`/procedure-logs/${id}/`),
    checkNewerLog: (id: number) => apiClient.get<{ has_newer: boolean; newer_id: number | null; status: string | null }>(`/procedure-logs/${id}/check-newer/`),

    startProcedure: (procedureId: number, entityId: number) =>
        apiClient.post<ApiResponse<ProcedureLog>>('/procedure-logs/', {
            procedure_id: procedureId,
            entity_id: entityId
        }),

    completeProcedure: (logId: number, data?: CompleteProcedureData) =>
        apiClient.post<ApiResponse<ProcedureLog>>(`/procedure-logs/${logId}/complete/`, data),

    // ============ Step Actions ============
    completeStep: (logId: number, stepId: number, data?: CompleteStepData) =>
        apiClient.post<ApiResponse<StepLog>>(`/procedure-logs/${logId}/steps/${stepId}/complete/`, data),

    skipStep: (logId: number, stepId: number, reason?: string) =>
        apiClient.post<ApiResponse<StepLog>>(`/procedure-logs/${logId}/steps/${stepId}/skip/`, { notes: reason }),

    // ============ Step Reminders ============
    createStepReminder: (stepLogId: number, remindAt: string, message: string) =>
        apiClient.post<ApiResponse<any>>('/step-reminders/', {
            step_log_id: stepLogId,
            remind_at: remindAt,
            message: message
        }),

    getStepReminders: (stepLogId?: number) =>
        apiClient.get<ApiResponse<any[]>>('/step-reminders/', {
            params: stepLogId ? { step_log: stepLogId } : undefined
        }),

    deleteStepReminder: (id: number) =>
        apiClient.delete<void>(`/step-reminders/${id}/`),
};

