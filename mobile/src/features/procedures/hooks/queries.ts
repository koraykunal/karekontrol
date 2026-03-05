import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/store/react-query/keys';
import { procedureService } from '@/src/api/services/procedure.service';
import type { ProcedureFilters, ProcedureLogFilters } from '@/src/api/types/procedure.types';

/**
 * Fetch a single procedure by ID
 */
export function useProcedure(procedureId: number) {
    return useQuery({
        queryKey: queryKeys.procedures.detail(procedureId),
        queryFn: () => procedureService.getProcedure(procedureId),
        enabled: !!procedureId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch procedures list with optional filters
 */
export function useProcedures(filters?: ProcedureFilters) {
    return useQuery({
        queryKey: queryKeys.procedures.list(filters ?? {}),
        queryFn: () => procedureService.getProcedures(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch a single procedure log by ID
 */
export function useProcedureLog(logId: number) {
    return useQuery({
        queryKey: queryKeys.procedureLogs.detail(logId),
        queryFn: () => procedureService.getProcedureLog(logId),
        enabled: !!logId,
        staleTime: 1 * 60 * 1000, // 1 minute for active executions
    });
}

/**
 * Fetch procedure logs list with optional filters
 */
export function useProcedureLogs(filters?: ProcedureLogFilters) {
    return useQuery({
        queryKey: queryKeys.procedureLogs.list(filters ?? {}),
        queryFn: () => procedureService.getProcedureLogs(filters),
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Fetch active procedure logs
 */
export function useActiveProcedureLogs() {
    return useQuery({
        queryKey: queryKeys.procedureLogs.active(),
        queryFn: () => procedureService.getProcedureLogs({ status: 'in_progress' }),
        staleTime: 1 * 60 * 1000,
    });
}
