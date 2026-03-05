export type PermissionKey =
  | 'view_entities'
  | 'create_entities'
  | 'edit_entities'
  | 'delete_entities'
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'change_user_roles'
  | 'view_procedures'
  | 'create_procedures'
  | 'edit_procedures'
  | 'delete_procedures'
  | 'assign_procedures'
  | 'view_executions'
  | 'create_executions'
  | 'edit_executions'
  | 'delete_executions'
  | 'view_issues'
  | 'create_issues'
  | 'edit_issues'
  | 'delete_issues'
  | 'resolve_issues'
  | 'view_departments'
  | 'create_departments'
  | 'edit_departments'
  | 'delete_departments'
  | 'view_organizations'
  | 'edit_organizations'
  | 'access_reports'
  | 'export_reports'
  | 'view_analytics'
  | 'access_management'
  | 'configure_permissions'
  | 'view_audit_logs'
  | 'manage_system_settings';

export type PermissionScope =
  | 'OWN'
  | 'DEPARTMENT'
  | 'ORGANIZATION'
  | 'ALL';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'WORKER';

export interface PermissionConfig {
  enabled: boolean;
  scope?: PermissionScope;
}

export type UserPermissions = {
  [key in PermissionKey]?: PermissionConfig;
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  'view_entities': 'View Entities',
  'create_entities': 'Create Entities',
  'edit_entities': 'Edit Entities',
  'delete_entities': 'Delete Entities',
  'view_users': 'View Users',
  'create_users': 'Create Users',
  'edit_users': 'Edit Users',
  'delete_users': 'Delete Users',
  'change_user_roles': 'Change User Roles',
  'view_procedures': 'View Procedures',
  'create_procedures': 'Create Procedures',
  'edit_procedures': 'Edit Procedures',
  'delete_procedures': 'Delete Procedures',
  'assign_procedures': 'Assign Procedures',
  'view_executions': 'View Procedure Executions',
  'create_executions': 'Create Procedure Executions',
  'edit_executions': 'Edit Procedure Executions',
  'delete_executions': 'Delete Procedure Executions',
  'view_issues': 'View Issues',
  'create_issues': 'Create Issues',
  'edit_issues': 'Edit Issues',
  'delete_issues': 'Delete Issues',
  'resolve_issues': 'Resolve Issues',
  'view_departments': 'View Departments',
  'create_departments': 'Create Departments',
  'edit_departments': 'Edit Departments',
  'delete_departments': 'Delete Departments',
  'view_organizations': 'View Organizations',
  'edit_organizations': 'Edit Organizations',
  'access_reports': 'Access Reports',
  'export_reports': 'Export Reports',
  'view_analytics': 'View Analytics Dashboard',
  'access_management': 'Access Management Panel',
  'configure_permissions': 'Configure Permissions',
  'view_audit_logs': 'View Audit Logs',
  'manage_system_settings': 'Manage System Settings'
};

export const SCOPE_LABELS: Record<PermissionScope, string> = {
  'OWN': 'Own',
  'DEPARTMENT': 'Department',
  'ORGANIZATION': 'Organization',
  'ALL': 'All'
};

export const ROLE_LABELS: Record<UserRole, string> = {
  'SUPER_ADMIN': 'Super Admin',
  'ADMIN': 'Admin',
  'MANAGER': 'Manager',
  'WORKER': 'Worker'
};
