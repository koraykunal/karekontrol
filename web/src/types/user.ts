import type { UserRole } from '@/lib/constants'

export interface User {
    id: number
    email: string
    full_name: string
    role: UserRole
    is_active: boolean
    phone: string | null
    avatar_url: string | null
    organization: number | null
    organization_name: string | null
    department: number | null
    department_name: string | null
    permissions?: Record<string, { enabled: boolean; scope?: string }>
    created_at: string
    updated_at: string
}

export interface UserListItem {
    id: number
    email: string
    full_name: string
    role: UserRole
    is_active: boolean
    organization: number | null
    organization_name: string | null
    department: number | null
    department_name: string | null
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface AuthTokens {
    access: string
    refresh: string
    user: User
}

export interface ChangePasswordPayload {
    old_password: string
    new_password: string
    new_password_confirm: string
}

export interface RegisterPayload {
    email: string
    full_name: string
    phone?: string
    password: string
    password_confirm: string
    organization?: number
    department?: number
    role?: UserRole
}

export interface UpdateUserPayload {
    full_name?: string
    phone?: string
    avatar_url?: string
}

export interface AdminCreateUserPayload {
    email: string
    full_name: string
    phone?: string
    password: string
    password_confirm: string
    organization: number
    department?: number | null
    role: UserRole
}
