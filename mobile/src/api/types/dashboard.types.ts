export interface DashboardStats {
    total_procedures: number;
    total_assignments: number;
    completed_assignments: number;
    pending_assignments: number;
    active_employees: number;
    compliance_issues: number;
}

export interface ManagerStats {
    team_size: number;
    active_procedures: number;
    completed_procedures_last_30_days: number;
    pending_procedures: number;
    compliance_rate: number;
    open_issues: number;
    resolved_issues: number;
    department_name: string;
}
