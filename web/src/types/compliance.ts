import type { IssueSeverity, IssueStatus } from '@/lib/constants'

export interface NonComplianceIssue {
    id: number
    entity: number
    entity_name?: string
    procedure_log: number
    step_log: number | null
    title: string
    description: string
    severity: IssueSeverity
    status: IssueStatus
    photo_urls: string[]
    resolution_photo_urls: string[]
    resolved_notes: string | null
    reported_by: number | null
    reported_by_name?: string
    resolved_by: number | null
    resolved_by_name?: string
    resolved_at: string | null
    assigned_to_department: number | null
    assigned_to_department_name?: string
    assigned_to_user: number | null
    assigned_to_user_name?: string
    due_date: string | null
    category: string | null
    tags: string[]
    created_at: string
    updated_at: string
}

export interface IssueListItem {
    id: number
    entity: number
    entity_name?: string
    title: string
    severity: IssueSeverity
    status: IssueStatus
    assigned_to_department: number | null
    assigned_to_user: number | null
    due_date: string | null
    created_at: string
}

export interface IssueComment {
    id: number
    issue: number
    user: number | null
    user_name?: string
    content: string
    attachments: string[]
    is_internal: boolean
    created_at: string
}

export interface HelpRequest {
    id: number
    issue: number
    from_department: number
    from_department_name?: string
    to_department: number
    to_department_name?: string
    requested_by: number | null
    requested_by_name?: string
    target_user: number | null
    target_user_name?: string
    message: string
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
    responded_by: number | null
    responded_by_name?: string
    response_message: string | null
    responded_at: string | null
    created_at: string
}

export interface CreateIssuePayload {
    entity: number
    procedure_log: number
    step_log?: number
    title: string
    description: string
    severity?: IssueSeverity
    photo_urls?: string[]
    category?: string
    tags?: string[]
}
