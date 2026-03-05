import type { ReportType, ReportTriggerType, ReportStatus } from '@/lib/constants'

export interface Report {
    id: number
    organization: number
    organization_name?: string
    department: number | null
    department_name?: string
    report_type: ReportType
    period_month: number
    period_year: number
    title: string
    description: string | null
    file: string | null
    file_size: number | null
    generated_by_user: number | null
    generated_by_name?: string
    triggered_by: ReportTriggerType
    valid_from: string
    valid_until: string | null
    status: ReportStatus
    error_message: string | null
    total_procedures: number
    completed_procedures: number
    pending_procedures: number
    non_compliance_count: number
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface ReportListItem {
    id: number
    organization: number
    department: number | null
    report_type: ReportType
    period_month: number
    period_year: number
    title: string
    status: ReportStatus
    total_procedures: number
    completed_procedures: number
    non_compliance_count: number
    created_at: string
}

export interface ReportDistribution {
    id: number
    report: number
    user: number
    user_name?: string
    distributed_at: string
    download_count: number
    last_downloaded_at: string | null
    delivery_method: 'EMAIL' | 'PUSH' | 'PORTAL'
    status: 'PENDING' | 'SENT' | 'FAILED'
}

export interface ReportSchedule {
    id: number
    organization: number
    department: number | null
    is_active: boolean
    report_type: ReportType
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    trigger_day_of_month: number
    trigger_hour: number
    trigger_minute: number
    timezone: string
    recipient_email_list: string[]
    should_notify_department_head: boolean
    should_notify_compliance_officer: boolean
    last_run: string | null
    next_run: string | null
    created_at: string
}
