'use client'

import { useAuthStore } from '@/store/auth'
import { UserRole, PermissionAction, ResourceType } from '@/lib/constants'

export function usePermissions() {
    const user = useAuthStore((s) => s.user)

    const role = user?.role

    const isPlatformOwner = role === UserRole.SUPER_ADMIN
    const isAdmin = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN
    const isManager = role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.MANAGER

    const can = (action: PermissionAction, resource?: ResourceType): boolean => {
        if (!role) return false
        if (isPlatformOwner) return true

        // Policy-based check if user has permissions from backend
        if (user?.permissions && resource) {
            const permKey = `${action}_${resource}`.toLowerCase()
            const perm = user.permissions[permKey]
            if (perm !== undefined) {
                return perm.enabled
            }
        }

        // Role-based fallback
        if (action === PermissionAction.VIEW) return true
        if (action === PermissionAction.CREATE || action === PermissionAction.EDIT) return isAdmin || isManager
        if (action === PermissionAction.DELETE || action === PermissionAction.APPROVE) return isAdmin
        if (action === PermissionAction.ASSIGN) return isAdmin || isManager
        if (action === PermissionAction.RESOLVE) return isAdmin || isManager

        return false
    }

    return { isPlatformOwner, isAdmin, isManager, can, role }
}
