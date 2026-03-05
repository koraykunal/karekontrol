import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/store/react-query/keys';
import { procedureService } from '@/src/api/services/procedure.service';
import type { CompleteProcedureData, CompleteStepData } from '@/src/api/types/procedure.types';

/**
 * Start a procedure execution
 */
export function useStartProcedure() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ procedureId, entityId }: { procedureId: number; entityId: number }) =>
            procedureService.startProcedure(procedureId, entityId),
        onSuccess: (_, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.procedureLogs.all() });
            queryClient.invalidateQueries({ queryKey: queryKeys.procedureLogs.byEntity(variables.entityId) });
        },
    });
}

/**
 * Complete a procedure
 */
export function useCompleteProcedure() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ logId, data }: { logId: number; data?: CompleteProcedureData }) =>
            procedureService.completeProcedure(logId, data),
        onSuccess: (_, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.procedureLogs.detail(variables.logId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.procedureLogs.lists() });
        },
    });
}

/**
 * Complete a step within a procedure
 */
export function useCompleteStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ logId, stepId, data }: { logId: number; stepId: number; data?: CompleteStepData }) =>
            procedureService.completeStep(logId, stepId, data),
        onSuccess: (_, variables) => {
            // Invalidate the procedure log to update step statuses
            queryClient.invalidateQueries({ queryKey: queryKeys.procedureLogs.detail(variables.logId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.stepLogs.byProcedureLog(variables.logId) });
        },
    });
}

/**
 * Skip a step within a procedure
 */
export function useSkipStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ logId, stepId, reason }: { logId: number; stepId: number; reason?: string }) =>
            procedureService.skipStep(logId, stepId, reason),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.procedureLogs.detail(variables.logId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.stepLogs.byProcedureLog(variables.logId) });
        },
    });
}
