import { TimestampMixin } from './common.types';
import { IssueStatus, IssueSeverity, IssueCategory } from './enums';

export interface NonComplianceIssue extends TimestampMixin {
  id: number;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  department: number;
  department_name: string;
  organization: number;
  organization_name: string;
  reported_by: number;
  reported_by_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  entity: number | null;
  entity_name: string | null;
  procedure_log: number | null;
  step_title?: string;
  step_log?: number | null;
  location: string | null;
  due_date: string | null;
  resolved_at: string | null;
  resolved_by: number | null;
  resolved_by_name: string | null;
  photo_urls: string[];
  resolution_photo_urls: string[];
  resolved_notes: string | null;
  tags: string[];
  metadata: Record<string, any> | null;
}

export interface ResolveIssuePayload {
  notes?: string;
  photos?: string[];
}

export interface IssueComment extends TimestampMixin {
  id: number;
  issue: number;
  user: number;
  user_name: string;
  content: string;
  is_internal: boolean;
  attachments: string[];
}

export interface HelpRequest extends TimestampMixin {
  id: number;
  issue: number | null;
  issue_title: string | null;
  from_department: number;
  from_department_name: string;
  to_department: number;
  to_department_name: string;
  requested_by: number;
  requested_by_name: string;
  target_user: number | null;
  target_user_name: string | null;
  message: string;
  status: string;
  responded_by: number | null;
  responded_by_name: string | null;
  response_message: string | null;
  responded_at: string | null;
}

export interface IssueFilters {
  department?: number;
  category?: IssueCategory;
  severity?: IssueSeverity;
  status?: IssueStatus;
  assigned_to?: number;
  reported_by?: number;
  entity?: number;
  search?: string;
  tags?: string[];
  page?: number;
  page_size?: number;
}
