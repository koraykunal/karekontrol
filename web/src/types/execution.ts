import type { ProcedureLogStatus } from '@/lib/constants'
import type { Procedure, ProcedureStep } from './procedure'
import type { EntityListItem } from './entity'

export interface ProcedureLog {
    id: number
    procedure_id: number
    entity_id: number
    user_id: number | null
    organization_name?: string
    entity_name?: string
    procedure_title?: string
    user_name?: string
    completed_by_name?: string
    procedure: Procedure
    entity: EntityListItem
    status: ProcedureLogStatus
    started_at: string
    completed_at: string | null
    next_procedure_date: string | null
    has_unresolved_issues: boolean
    blocked_by_issues: boolean
    blocking_issues_count: number
    duration_minutes: number | null
    duration_formatted?: string
    is_overdue?: boolean
    notes: string | null
    completion_percentage: number
    completed_steps?: number
    total_steps?: number
    compliance_rate?: number
    total_duration_minutes?: number | null
    step_logs: StepLog[]
    created_at: string
    updated_at: string
}

export interface ProcedureLogListItem {
    id: number
    procedure_id: number
    entity_name?: string
    procedure_title?: string
    user_name?: string
    started_by_name?: string
    status: ProcedureLogStatus
    started_at: string
    completed_at: string | null
    completion_percentage: number
    is_overdue?: boolean
    duration_formatted?: string
    step_logs: StepLog[]
}

export interface StepLog {
    id: number
    procedure_log_id: number
    step_id: number
    procedure_step_id: number
    step_title?: string
    step_order?: number
    completed_by_user_id: number | null
    completed_by_name?: string
    is_completed: boolean
    is_compliant: boolean
    completion_status: string | null
    has_blocking_issue: boolean
    issues: Array<{ id: number; status: string; resolved_at: string | null; title: string; severity: string }>
    notes: string | null
    photo_url: string | null
    photo_urls: string[]
    completed_at: string | null
    checklist_results: Record<string, { checked: boolean }>
    duration_minutes: number | null
    completion_rate?: number
    procedure_step: ProcedureStep | null
    created_at: string
    updated_at: string
}

export interface StepReminder {
    id: number
    user: number
    step_log: number
    procedure_log: number
    remind_at: string
    message: string
    is_sent: boolean
    sent_at: string | null
    created_at: string
}

export interface ProcedureShare {
    id: number
    procedure_log: number
    shared_with_department: number
    shared_with_department_name?: string
    shared_by_user: number | null
    shared_by_user_name?: string
    reason: string | null
    is_active: boolean
    expires_at: string | null
    created_at: string
}

export interface Reminder {
    id: number
    user: number
    title: string
    description: string | null
    scheduled_for: string
    is_completed: boolean
    completed_at: string | null
    related_entity_type: string | null
    related_entity_id: number | null
    created_at: string
}
