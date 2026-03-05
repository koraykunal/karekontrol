from rest_framework import permissions
from .engine import PermissionEngine
from .enums import PermissionKey


class BasePermission(permissions.BasePermission):
    permission_key = None

    def has_permission(self, request, view):
        if not self.permission_key:
            return False
        return PermissionEngine.check(request.user, self.permission_key)

    def has_object_permission(self, request, view, obj):
        if not self.permission_key:
            return False
        return PermissionEngine.check(request.user, self.permission_key, resource=obj)


class CanViewEntities(BasePermission):
    permission_key = PermissionKey.VIEW_ENTITIES


class CanCreateEntities(BasePermission):
    permission_key = PermissionKey.CREATE_ENTITIES


class CanEditEntities(BasePermission):
    permission_key = PermissionKey.EDIT_ENTITIES


class CanDeleteEntities(BasePermission):
    permission_key = PermissionKey.DELETE_ENTITIES


class CanViewUsers(BasePermission):
    permission_key = PermissionKey.VIEW_USERS


class CanCreateUsers(BasePermission):
    permission_key = PermissionKey.CREATE_USERS


class CanEditUsers(BasePermission):
    permission_key = PermissionKey.EDIT_USERS


class CanDeleteUsers(BasePermission):
    permission_key = PermissionKey.DELETE_USERS


class CanChangeUserRoles(BasePermission):
    permission_key = PermissionKey.CHANGE_USER_ROLES


class CanViewProcedures(BasePermission):
    permission_key = PermissionKey.VIEW_PROCEDURES


class CanCreateProcedures(BasePermission):
    permission_key = PermissionKey.CREATE_PROCEDURES


class CanEditProcedures(BasePermission):
    permission_key = PermissionKey.EDIT_PROCEDURES


class CanDeleteProcedures(BasePermission):
    permission_key = PermissionKey.DELETE_PROCEDURES


class CanAssignProcedures(BasePermission):
    permission_key = PermissionKey.ASSIGN_PROCEDURES


class CanViewExecutions(BasePermission):
    permission_key = PermissionKey.VIEW_EXECUTIONS


class CanCreateExecutions(BasePermission):
    permission_key = PermissionKey.CREATE_EXECUTIONS


class CanEditExecutions(BasePermission):
    permission_key = PermissionKey.EDIT_EXECUTIONS


class CanDeleteExecutions(BasePermission):
    permission_key = PermissionKey.DELETE_EXECUTIONS


class CanViewIssues(BasePermission):
    permission_key = PermissionKey.VIEW_ISSUES


class CanCreateIssues(BasePermission):
    permission_key = PermissionKey.CREATE_ISSUES


class CanEditIssues(BasePermission):
    permission_key = PermissionKey.EDIT_ISSUES


class CanDeleteIssues(BasePermission):
    permission_key = PermissionKey.DELETE_ISSUES


class CanResolveIssues(BasePermission):
    permission_key = PermissionKey.RESOLVE_ISSUES


class CanViewDepartments(BasePermission):
    permission_key = PermissionKey.VIEW_DEPARTMENTS


class CanCreateDepartments(BasePermission):
    permission_key = PermissionKey.CREATE_DEPARTMENTS


class CanEditDepartments(BasePermission):
    permission_key = PermissionKey.EDIT_DEPARTMENTS


class CanDeleteDepartments(BasePermission):
    permission_key = PermissionKey.DELETE_DEPARTMENTS


class CanViewOrganizations(BasePermission):
    permission_key = PermissionKey.VIEW_ORGANIZATIONS


class CanEditOrganizations(BasePermission):
    permission_key = PermissionKey.EDIT_ORGANIZATIONS


class CanAccessReports(BasePermission):
    permission_key = PermissionKey.ACCESS_REPORTS


class CanExportReports(BasePermission):
    permission_key = PermissionKey.EXPORT_REPORTS


class CanViewAnalytics(BasePermission):
    permission_key = PermissionKey.VIEW_ANALYTICS


class CanAccessManagement(BasePermission):
    permission_key = PermissionKey.ACCESS_MANAGEMENT


class CanConfigurePermissions(BasePermission):
    permission_key = PermissionKey.CONFIGURE_PERMISSIONS


class CanViewAuditLogs(BasePermission):
    permission_key = PermissionKey.VIEW_AUDIT_LOGS


class CanManageSystemSettings(BasePermission):
    permission_key = PermissionKey.MANAGE_SYSTEM_SETTINGS
