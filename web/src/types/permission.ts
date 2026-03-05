import type { PermissionAction, PermissionScope, ResourceType, AssignmentStatus, UserRole } from '@/lib/constants'

export interface UserPermission {
    id: number
    user: number
    user_name?: string
    resource_type: ResourceType
    action: PermissionAction
    resource_id: number | null
    scope: PermissionScope
    granted_by_user: number | null
    granted_by_user_name?: string
    expires_at: string | null
    is_active: boolean
    reason: string | null
    created_at: string
}

export interface RolePermissionConfig {
    id: number
    organization: number | null
    organization_name?: string
    department: number | null
    department_name?: string
    role: string
    permissions: Record<string, unknown>
    configured_by_user: number | null
    notes: string | null
    is_active: boolean
    created_at: string
}

export interface ProcedureAssignment {
    id: number
    procedure: number
    procedure_title?: string
    assigned_to_user: number
    assigned_to_user_name?: string
    assigned_by_user: number | null
    assigned_by_user_name?: string
    assignment_reason: string | null
    assignment_notes: string | null
    valid_from: string
    valid_until: string | null
    status: AssignmentStatus
    is_active: boolean
    recurring: boolean
    created_at: string
}

export interface PermissionPolicy {
    id: number
    organization: number
    organization_name?: string
    department: number | null
    department_name?: string
    role: UserRole
    permissions: Record<string, { enabled: boolean; scope?: PermissionScope }>
    is_active: boolean
    configured_by: number | null
    notes: string
    created_at: string
}
