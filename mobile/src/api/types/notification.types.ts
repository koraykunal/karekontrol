import { TimestampMixin } from './common.types';
import { NotificationPriority } from './enums';

export type NotificationType =
  | 'PROCEDURE_DUE'
  | 'PROCEDURE_OVERDUE'
  | 'STEP_OVERDUE'
  | 'NON_COMPLIANCE_REPORTED'
  | 'NON_COMPLIANCE_ASSIGNED'
  | 'NON_COMPLIANCE_RESOLVED'
  | 'NON_COMPLIANCE_OVERDUE'
  | 'NON_COMPLIANCE_COMMENT'
  | 'NON_COMPLIANCE_STATUS_CHANGED'
  | 'HELP_REQUEST_RECEIVED'
  | 'HELP_REQUEST_RESPONDED'
  | 'ENTITY_SHARED'
  | 'PROCEDURE_SHARED'
  | 'ASSIGNMENT_NEW'
  | 'ASSIGNMENT_UPDATED'
  | 'SYSTEM';

export interface Notification extends TimestampMixin {
  id: number;
  user: number;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  is_persistent: boolean;
  read_at: string | null;
  action_url: string | null;
  entity: number | null;
  procedure_log: number | null;
  step_log: number | null;
  issue: number | null;
  metadata: Record<string, any> | null;
}

export interface PushToken extends TimestampMixin {
  id: number;
  user: number;
  token: string;
  device_type: 'ios' | 'android' | 'web';
  device_name: string;
  is_active: boolean;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  page_size?: number;
}

export interface PushTokenRequest {
  token: string;
  device_type: string;
  device_name: string;
  is_active: boolean;
}

export interface NotificationPreference {
  id: number;
  procedure_due_enabled: boolean;
  procedure_overdue_enabled: boolean;
  issue_enabled: boolean;
  help_request_enabled: boolean;
  push_enabled: boolean;
  reminder_days_before: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}
