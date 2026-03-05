export interface AuditLog {
    id: number
    organization: number | null
    organization_name?: string
    department: number | null
    department_name?: string
    user: number | null
    user_name?: string
    action: string
    resource_type: string
    resource_id: number | null
    resource_title: string | null
    target_user: number | null
    target_user_name?: string
    details: Record<string, unknown>
    ip_address: string | null
    user_agent: string | null
    log_date: string
    week_number: number | null
    month_year: string | null
    request_path: string | null
    request_method: string | null
    status_code: number | null
    created_at: string
}

export interface AuditLogListItem {
    id: number
    user: number | null
    user_name?: string
    action: string
    resource_type: string
    resource_title: string | null
    log_date: string
    created_at: string
}
