import type { NotificationType } from '@/lib/constants'

export interface Notification {
    id: number
    user: number
    entity: number | null
    procedure_log: number | null
    step_log: number | null
    issue: number | null
    type: NotificationType
    title: string
    message: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    is_read: boolean
    is_persistent: boolean
    read_at: string | null
    action_url: string | null
    metadata: Record<string, unknown>
    created_at: string
}

export interface NotificationPreference {
    id: number
    user: number
    procedure_due_enabled: boolean
    procedure_overdue_enabled: boolean
    issue_enabled: boolean
    help_request_enabled: boolean
    push_enabled: boolean
    reminder_days_before: number
    quiet_hours_enabled: boolean
    quiet_hours_start: string | null
    quiet_hours_end: string | null
}

export interface PushToken {
    id: number
    user: number
    token: string
    device_type: 'ios' | 'android' | 'web' | null
    device_name: string | null
    is_active: boolean
    last_used_at: string
    created_at: string
}
