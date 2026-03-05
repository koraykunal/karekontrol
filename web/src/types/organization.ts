export interface Organization {
    id: number
    name: string
    company_number: string
    registration_number: string | null
    qr_quota: number
    description: string | null
    is_active: boolean
    is_sandbox: boolean
    contact_email: string | null
    contact_phone: string | null
    address: string | null
    department_count: number
    user_count: number
    entity_count: number
    created_at: string
    updated_at: string
}

export interface OrganizationListItem {
    id: number
    name: string
    company_number: string
    qr_quota: number
    is_active: boolean
    is_sandbox: boolean
    department_count: number
    created_at: string
}

export interface SandboxResetResult {
    organization_id: number
    admin_email: string
    departments_created: number
    users_created: number
    entities_created: number
    procedures_created: number
}

export interface Department {
    id: number
    organization: number
    organization_name?: string
    manager: number | null
    manager_name?: string | null
    name: string
    description: string | null
    code: string | null
    user_count: number
    created_at: string
    updated_at: string
}

export interface DepartmentListItem {
    id: number
    organization: number
    organization_name?: string
    name: string
    code: string | null
    manager_name?: string | null
}

export interface CreateOrganizationPayload {
    name: string
    company_number: string
    registration_number?: string
    qr_quota?: number
    description?: string
    contact_email?: string
    contact_phone?: string
    address?: string
}

export interface OnboardOrganizationPayload {
    name: string
    company_number: string
    registration_number?: string
    address?: string
    contact_email?: string
    contact_phone?: string
    description?: string
    qr_quota: number
    admin_full_name: string
    admin_email: string
    admin_phone?: string
    admin_password?: string
}

export interface OnboardOrganizationResponse {
    organization: Organization
    admin_user: import('./user').User
    admin_password: string
}

export interface QuotaInfo {
    qr_quota: number
    entity_count: number
    remaining: number | null
    is_unlimited: boolean
}

export interface CreateDepartmentPayload {
    organization: number
    name: string
    description?: string
    code?: string
}
