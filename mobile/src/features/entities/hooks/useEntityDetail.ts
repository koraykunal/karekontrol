import { useQuery } from '@tanstack/react-query';
import { entityService } from '@/src/api/services/entity.service';
import { procedureService } from '@/src/api/services/procedure.service';
import { Entity } from '@/src/api/types/entity.types';
import { ProcedureLogStatus } from '@/src/api/types/enums';

interface EntityDetailData {
    entity: Entity | null;
    procedures: any[];
    activeProcedures: any[];
}

export function useEntityDetail(entityId: number, activeTab: 'overview' | 'history') {
    const query = useQuery({
        queryKey: ['entityDetail', entityId],
        queryFn: async (): Promise<EntityDetailData> => {
            const entityRes = await entityService.getEntity(entityId);
            const entity = (entityRes as any).data || entityRes;

            let procedures: any[] = [];
            try {
                const procsRes = await procedureService.getProcedures({ entity: entityId });
                procedures = (procsRes as any).data || (procsRes as any).results || (Array.isArray(procsRes) ? procsRes : []);
            } catch (e) {
                console.log('Failed to fetch procedures', e);
            }

            let activeProcedures: any[] = [];
            try {
                const logsRes = await procedureService.getProcedureLogs({ entity: entityId, status: ProcedureLogStatus.IN_PROGRESS });
                const logs = (logsRes as any).data || (logsRes as any).results || [];
                activeProcedures = logs.map((l: any) => ({
                    id: l.id,
                    procedure_id: l.procedure_id,
                    procedure_title: l.procedure_title || `Prosedür #${l.procedure}`,
                    started_at: l.started_at,
                    completion_percentage: l.completion_percentage ?? 0,
                    status: l.status
                }));
            } catch (e) {
                console.log('Failed to fetch logs', e);
            }

            return { entity, procedures, activeProcedures };
        },
        staleTime: 2 * 60 * 1000,
    });

    return {
        entity: query.data?.entity ?? null,
        procedures: query.data?.procedures ?? [],
        activeProcedures: query.data?.activeProcedures ?? [],
        loading: query.isLoading,
        refetch: query.refetch,
    };
}
