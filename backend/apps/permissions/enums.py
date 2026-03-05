from django.db import models


class PermissionKey(models.TextChoices):
    VIEW_ENTITIES = 'view_entities', 'View Entities'
    CREATE_ENTITIES = 'create_entities', 'Create Entities'
    EDIT_ENTITIES = 'edit_entities', 'Edit Entities'
    DELETE_ENTITIES = 'delete_entities', 'Delete Entities'
    VIEW_USERS = 'view_users', 'View Users'
    CREATE_USERS = 'create_users', 'Create Users'
    EDIT_USERS = 'edit_users', 'Edit Users'
    DELETE_USERS = 'delete_users', 'Delete Users'
    CHANGE_USER_ROLES = 'change_user_roles', 'Change User Roles'
    VIEW_PROCEDURES = 'view_procedures', 'View Procedures'
    CREATE_PROCEDURES = 'create_procedures', 'Create Procedures'
    EDIT_PROCEDURES = 'edit_procedures', 'Edit Procedures'
    DELETE_PROCEDURES = 'delete_procedures', 'Delete Procedures'
    ASSIGN_PROCEDURES = 'assign_procedures', 'Assign Procedures'
    VIEW_EXECUTIONS = 'view_executions', 'View Procedure Executions'
    CREATE_EXECUTIONS = 'create_executions', 'Create Procedure Executions'
    EDIT_EXECUTIONS = 'edit_executions', 'Edit Procedure Executions'
    DELETE_EXECUTIONS = 'delete_executions', 'Delete Procedure Executions'
    VIEW_ISSUES = 'view_issues', 'View Issues'
    CREATE_ISSUES = 'create_issues', 'Create Issues'
    EDIT_ISSUES = 'edit_issues', 'Edit Issues'
    DELETE_ISSUES = 'delete_issues', 'Delete Issues'
    RESOLVE_ISSUES = 'resolve_issues', 'Resolve Issues'
    VIEW_DEPARTMENTS = 'view_departments', 'View Departments'
    CREATE_DEPARTMENTS = 'create_departments', 'Create Departments'
    EDIT_DEPARTMENTS = 'edit_departments', 'Edit Departments'
    DELETE_DEPARTMENTS = 'delete_departments', 'Delete Departments'
    VIEW_ORGANIZATIONS = 'view_organizations', 'View Organizations'
    EDIT_ORGANIZATIONS = 'edit_organizations', 'Edit Organizations'
    ACCESS_REPORTS = 'access_reports', 'Access Reports'
    EXPORT_REPORTS = 'export_reports', 'Export Reports'
    VIEW_ANALYTICS = 'view_analytics', 'View Analytics Dashboard'
    ACCESS_MANAGEMENT = 'access_management', 'Access Management Panel'
    CONFIGURE_PERMISSIONS = 'configure_permissions', 'Configure Permissions'
    VIEW_AUDIT_LOGS = 'view_audit_logs', 'View Audit Logs'
    MANAGE_SYSTEM_SETTINGS = 'manage_system_settings', 'Manage System Settings'


from apps.core.constants import PermissionScope

__all__ = ['PermissionKey', 'PermissionScope']
