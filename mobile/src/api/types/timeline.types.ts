export type TimelineEventType =
    | 'procedure_started'
    | 'procedure_completed'
    | 'issue_reported'
    | 'issue_resolved'
    | 'step_skipped'
    | 'audit_log';

export interface TimelineEvent {
    id: string | number;
    event_type: TimelineEventType;
    title: string;
    description?: string;
    timestamp: string;
    user_name?: string;
    metadata?: {
        procedure_log_id?: number;
        issue_id?: number;
        completion_status?: string;
        [key: string]: any;
    };
}

export interface EntityHistoryResponse {
    timeline: TimelineEvent[];
    total: number;
}
