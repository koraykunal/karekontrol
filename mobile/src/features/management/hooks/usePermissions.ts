import { useAuthStore } from '@/src/store/zustand/auth.store';
import { UserRole } from '@/src/api/types/enums';
import { PermissionKey, UserPermissions, PermissionScope } from '@/src/types/permissions.generated';

export function usePermissions() {
    const user = useAuthStore(state => state.user);
    const permissions: UserPermissions = user?.permissions || {};

    const hasPermission = (key: PermissionKey): boolean => {
        return permissions[key]?.enabled ?? false;
    };

    const getScope = (key: PermissionKey): PermissionScope | undefined => {
        return permissions[key]?.scope;
    };

    const canViewEntities = hasPermission('view_entities');
    const canCreateEntities = hasPermission('create_entities');
    const canEditEntities = hasPermission('edit_entities');
    const canDeleteEntities = hasPermission('delete_entities');
    const canViewUsers = hasPermission('view_users');
    const canCreateUsers = hasPermission('create_users');
    const canEditUsers = hasPermission('edit_users');
    const canDeleteUsers = hasPermission('delete_users');
    const canChangeUserRoles = hasPermission('change_user_roles');
    const canViewProcedures = hasPermission('view_procedures');
    const canCreateProcedures = hasPermission('create_procedures');
    const canEditProcedures = hasPermission('edit_procedures');
    const canDeleteProcedures = hasPermission('delete_procedures');
    const canAssignProcedures = hasPermission('assign_procedures');
    const canViewExecutions = hasPermission('view_executions');
    const canCreateExecutions = hasPermission('create_executions');
    const canEditExecutions = hasPermission('edit_executions');
    const canDeleteExecutions = hasPermission('delete_executions');
    const canViewIssues = hasPermission('view_issues');
    const canCreateIssues = hasPermission('create_issues');
    const canEditIssues = hasPermission('edit_issues');
    const canDeleteIssues = hasPermission('delete_issues');
    const canResolveIssues = hasPermission('resolve_issues');
    const canAccessReports = hasPermission('access_reports');
    const canExportReports = hasPermission('export_reports');
    const canViewAnalytics = hasPermission('view_analytics');
    const canAccessManagement = hasPermission('access_management');
    const canConfigurePermissions = hasPermission('configure_permissions');
    const canViewAuditLogs = hasPermission('view_audit_logs');
    const canManageSystemSettings = hasPermission('manage_system_settings');

    const isAdmin = user?.is_admin || user?.is_super_admin || false;
    const isManager = user?.is_manager || false;
    const canManage = canAccessManagement;

    const canManageDepartment = (departmentId: number | null | undefined): boolean => {
        const viewScope = getScope('view_entities');
        if (viewScope === 'ALL' || viewScope === 'ORGANIZATION') return true;
        if (!departmentId) return false;
        if (viewScope === 'DEPARTMENT' && user?.department === departmentId) return true;
        return false;
    };

    const getAssignableRoles = (): UserRole[] => {
        if (user?.is_super_admin) {
            return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER];
        }
        if (canChangeUserRoles) {
            return [UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER];
        }
        return [];
    };

    const canManageUsers = canViewUsers || canEditUsers || canCreateUsers;
    const canChangeRoles = canChangeUserRoles;

    return {
        hasPermission,
        getScope,
        canViewEntities,
        canCreateEntities,
        canEditEntities,
        canDeleteEntities,
        canViewUsers,
        canCreateUsers,
        canEditUsers,
        canDeleteUsers,
        canChangeUserRoles,
        canViewProcedures,
        canCreateProcedures,
        canEditProcedures,
        canDeleteProcedures,
        canAssignProcedures,
        canViewExecutions,
        canCreateExecutions,
        canEditExecutions,
        canDeleteExecutions,
        canViewIssues,
        canCreateIssues,
        canEditIssues,
        canDeleteIssues,
        canResolveIssues,
        canAccessReports,
        canExportReports,
        canViewAnalytics,
        canAccessManagement,
        canConfigurePermissions,
        canViewAuditLogs,
        canManageSystemSettings,
        canManageDepartment,
        getAssignableRoles,
        canManageUsers,
        canChangeRoles,
        isAdmin,
        isManager,
        canManage,
        permissions,
        user,
    };
}
