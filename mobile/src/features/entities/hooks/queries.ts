import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/store/react-query/keys';
import { entityService } from '@/src/api/services/entity.service';
import { procedureService } from '@/src/api/services/procedure.service';
import type { EntityFilters } from '@/src/api/types/entity.types';

/**
 * Fetch a single entity by ID
 */
export function useEntity(entityId: number) {
    return useQuery({
        queryKey: queryKeys.entities.detail(entityId),
        queryFn: () => entityService.getEntity(entityId),
        enabled: !!entityId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Fetch entities list with optional filters
 */
export function useEntities(filters?: EntityFilters) {
    return useQuery({
        queryKey: queryKeys.entities.list(filters ?? {}),
        queryFn: () => entityService.getEntities(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch procedures available for a specific entity
 */
export function useEntityProcedures(entityId: number) {
    return useQuery({
        queryKey: queryKeys.procedures.list({ entity: entityId }),
        queryFn: async () => {
            const response = await procedureService.getProcedures({ entity: entityId } as any);
            const data = (response as any).data || (response as any).results || response;
            return Array.isArray(data) ? data : [];
        },
        enabled: !!entityId,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch active procedure logs for a specific entity
 */
export function useEntityActiveProcedures(entityId: number) {
    return useQuery({
        queryKey: queryKeys.procedureLogs.byEntity(entityId),
        queryFn: async () => {
            const response = await procedureService.getProcedureLogs({
                entity: entityId,
                status: 'in_progress'
            });
            const data = (response as any).data || (response as any).results || response;
            const logs = Array.isArray(data) ? data : [];

            return logs.map((log: any) => ({
                id: log.id,
                procedure_title: log.procedure_title || `Prosedür #${log.procedure}`,
                started_at: log.started_at,
                completion_percentage: log.completion_percentage ?? 0,
                status: log.status
            }));
        },
        enabled: !!entityId,
        staleTime: 2 * 60 * 1000, // 2 minutes for active procedures
    });
}
