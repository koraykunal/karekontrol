export interface DashboardStats {
    total_procedures: number
    total_assignments: number
    completed_assignments: number
    pending_assignments: number
    active_employees: number
    compliance_issues: number
}

export interface DashboardActivity {
    id: number
    action: string
    content_type: string
    object_id: string
    object_repr: string
    user_name: string
    timestamp: string
}
