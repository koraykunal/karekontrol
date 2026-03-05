import { TimestampMixin } from './common.types';
import { ReportStatus, ReportFrequency } from './enums';

export interface Report extends TimestampMixin {
    id: number;
    organization: number;
    organization_name?: string;
    department: number | null;
    department_name?: string;
    report_type: string;
    period_month: number;
    period_year: number;
    title: string;
    description: string | null;
    file: string | null;
    file_size: number | null;
    generated_by_user: number | null;
    generated_by_name?: string;
    triggered_by: string;
    valid_from: string;
    valid_until: string | null;
    status: ReportStatus;
    error_message: string | null;
    total_procedures: number;
    completed_procedures: number;
    pending_procedures: number;
    non_compliance_count: number;
    metadata: Record<string, any>;
}

export interface ScheduledReport extends TimestampMixin {
    id: number;
    organization: number;
    organization_name?: string;
    department: number | null;
    department_name?: string;
    is_active: boolean;
    report_type: string;
    frequency: ReportFrequency;
    trigger_day_of_month: number;
    trigger_hour: number;
    trigger_minute: number;
    timezone: string;
    recipient_email_list: string[];
    should_notify_department_head: boolean;
    should_notify_compliance_officer: boolean;
    last_run: string | null;
    next_run: string | null;
}
