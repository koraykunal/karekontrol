import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {procedureService} from '@/src/api/services/procedure.service';
import {issueService} from '@/src/api/services/issue.service';
import type {TimelineEvent, EntityHistoryResponse, TimelineEventType} from '@/src/api/types/timeline.types';
import type {ProcedureLog, StepLog} from '@/src/api/types/procedure.types';
import type {NonComplianceIssue} from '@/src/api/types/issue.types';

interface UseEntityHistoryOptions {
    event_types?: string;
}

function transformDataToTimeline(logs: ProcedureLog[], issues: NonComplianceIssue[], eventTypesFilter?: string): EntityHistoryResponse {
    const timeline: TimelineEvent[] = [];

    for (const log of logs) {
        if (log.started_at) {
            timeline.push({
                id: `proc-start-${log.id}`,
                event_type: 'procedure_started',
                title: log.procedure_title || 'Prosedür',
                description: `${log.entity_name} için prosedür başlatıldı`,
                timestamp: log.started_at,
                user_name: (log as any).started_by_name || undefined,
                metadata: {
                    procedure_log_id: log.id,
                },
            });
        }

        const stepLogs: StepLog[] = (log as any).step_logs || [];
        for (const step of stepLogs) {
            if (step.is_completed && step.completion_status === 'NON_COMPLIANT') {
                timeline.push({
                    id: `step-nc-${step.id}`,
                    event_type: 'issue_reported',
                    title: step.step_title || step.procedure_step?.title || 'Uygunsuzluk',
                    description: step.notes || 'Adımda uygunsuzluk tespit edildi',
                    timestamp: step.completed_at || log.started_at || new Date().toISOString(),
                    user_name: step.completed_by_name || undefined,
                    metadata: {
                        procedure_log_id: log.id,
                        step_log_id: step.id,
                        completion_status: step.completion_status,
                        issue_id: step.issues?.[0]?.id ?? undefined,
                    },
                });
            }

            if (step.is_completed && step.completion_status === 'NOT_APPLICABLE') {
                timeline.push({
                    id: `step-skip-${step.id}`,
                    event_type: 'step_skipped',
                    title: step.step_title || step.procedure_step?.title || 'Kontrol Dışı',
                    description: step.notes || 'Adım kontrol dışı olarak işaretlendi',
                    timestamp: step.completed_at || log.started_at || new Date().toISOString(),
                    user_name: step.completed_by_name || undefined,
                    metadata: {
                        procedure_log_id: log.id,
                        step_log_id: step.id,
                        completion_status: step.completion_status,
                    },
                });
            }
        }

        if (log.completed_at && log.status === 'COMPLETED') {
            timeline.push({
                id: `proc-done-${log.id}`,
                event_type: 'procedure_completed',
                title: log.procedure_title || 'Prosedür',
                description: `Prosedür tamamlandı (${log.completion_percentage || 100}%)`,
                timestamp: log.completed_at,
                user_name: (log as any).assigned_to_name || undefined,
                metadata: {
                    procedure_log_id: log.id,
                },
            });
        }
    }

    for (const issue of issues) {
        if (issue.resolved_at) {
            timeline.push({
                id: `issue-res-${issue.id}`,
                event_type: 'issue_resolved',
                title: issue.title || 'Uygunsuzluk Çözüldü',
                description: issue.resolved_notes || 'Uygunsuzluk giderildi',
                timestamp: issue.resolved_at,
                user_name: issue.resolved_by_name || undefined,
                metadata: {
                    issue_id: issue.id,
                    procedure_log_id: issue.procedure_log ?? undefined,
                },
            });
        }
    }

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let filteredTimeline = timeline;
    if (eventTypesFilter) {
        const types = eventTypesFilter.split(',') as TimelineEventType[];
        filteredTimeline = timeline.filter(e => types.includes(e.event_type));
    }

    return {
        timeline: filteredTimeline,
        total: filteredTimeline.length,
    };
}

export function useEntityHistory(entityId: number, options?: UseEntityHistoryOptions) {
    const queryKey = ['entityHistory', entityId, options?.event_types] as const;

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const [logsRes, issuesRes] = await Promise.all([
                procedureService.getProcedureLogs({entity: entityId}),
                issueService.getIssues({entity: entityId})
            ]);

            const logs: ProcedureLog[] = (logsRes as any).data || (logsRes as any).results || [];
            const issues: NonComplianceIssue[] = (issuesRes as any).data || (issuesRes as any).results || [];

            return {logs, issues};
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnMount: false,
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    const data = React.useMemo(() => {
        if (!query.data) return null;
        return transformDataToTimeline(query.data.logs, query.data.issues, options?.event_types);
    }, [query.data, options?.event_types]);

    return {
        data,
        isLoading: query.isLoading,
        isRefetching: query.isFetching && !query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}
