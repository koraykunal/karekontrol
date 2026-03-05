import { procedureEndpoints } from '../endpoints/procedure.endpoints';
import type {
    ProcedureFilters,
    ProcedureLogFilters,
    CompleteProcedureData,
    CompleteStepData,
    CreateProcedureData,
    UpdateProcedureData,
    CreateStepData,
    UpdateStepData
} from '../types/procedure.types';

export const procedureService = {
    // ============ Procedures ============
    getProcedures: async (params?: ProcedureFilters) => {
        const response = await procedureEndpoints.getProcedures(params);
        return response.data;
    },

    getProcedure: async (id: number) => {
        const response = await procedureEndpoints.getProcedure(id);
        return response.data;
    },

    createProcedure: async (data: CreateProcedureData) => {
        const response = await procedureEndpoints.createProcedure(data);
        return response.data;
    },

    updateProcedure: async (id: number, data: UpdateProcedureData) => {
        const response = await procedureEndpoints.updateProcedure(id, data);
        return response.data;
    },

    deleteProcedure: async (id: number) => {
        await procedureEndpoints.deleteProcedure(id);
    },

    activateProcedure: async (id: number) => {
        const response = await procedureEndpoints.activateProcedure(id);
        return response.data;
    },

    deactivateProcedure: async (id: number) => {
        const response = await procedureEndpoints.deactivateProcedure(id);
        return response.data;
    },

    // ============ Procedure Steps ============
    getSteps: async (procedureId: number) => {
        const response = await procedureEndpoints.getSteps(procedureId);
        return response.data;
    },

    createStep: async (procedureId: number, data: CreateStepData) => {
        const response = await procedureEndpoints.createStep(procedureId, data);
        return response.data;
    },

    updateStep: async (stepId: number, data: UpdateStepData) => {
        const response = await procedureEndpoints.updateStep(stepId, data);
        return response.data;
    },

    deleteStep: async (stepId: number) => {
        await procedureEndpoints.deleteStep(stepId);
    },

    reorderSteps: async (procedureId: number, stepOrders: { id: number; order: number }[]) => {
        const response = await procedureEndpoints.reorderSteps(procedureId, stepOrders);
        return response.data;
    },

    // ============ Procedure Logs (Execution) ============
    getProcedureLogs: async (params?: ProcedureLogFilters) => {
        const response = await procedureEndpoints.getProcedureLogs(params);
        return response.data;
    },

    getProcedureLog: async (id: number) => {
        const response = await procedureEndpoints.getProcedureLog(id);
        return response.data;
    },

    checkNewerLog: async (id: number) => {
        const response = await procedureEndpoints.checkNewerLog(id);
        return response.data;
    },

    startProcedure: async (procedureId: number, entityId: number) => {
        const response = await procedureEndpoints.startProcedure(procedureId, entityId);
        return response.data;
    },

    completeProcedure: async (logId: number, data?: CompleteProcedureData) => {
        const response = await procedureEndpoints.completeProcedure(logId, data);
        return response.data;
    },

    completeStep: async (logId: number, stepId: number, data?: CompleteStepData) => {
        const response = await procedureEndpoints.completeStep(logId, stepId, data);
        return response.data;
    },

    skipStep: async (logId: number, stepId: number, reason?: string) => {
        const response = await procedureEndpoints.skipStep(logId, stepId, reason);
        return response.data;
    },
};
