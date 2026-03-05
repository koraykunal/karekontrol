import type { EntityFilters, ProcedureFilters, ProcedureLogFilters, IssueFilters, NotificationFilters } from '../../api/types';

/**
 * Query key factory pattern
 * Centralized query keys for type safety and consistency
 */
export const queryKeys = {
  // Auth
  auth: {
    all: () => ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },

  // Users
  users: {
    all: () => ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (filters: Record<string, any>) => ['users', 'list', filters] as const,
    details: () => ['users', 'detail'] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
    byDepartment: (deptId: number) => ['users', 'department', deptId] as const,
  },

  // Organizations
  organizations: {
    all: () => ['organizations'] as const,
    lists: () => ['organizations', 'list'] as const,
    list: (filters: Record<string, any>) => ['organizations', 'list', filters] as const,
    details: () => ['organizations', 'detail'] as const,
    detail: (id: number) => ['organizations', 'detail', id] as const,
  },

  // Departments
  departments: {
    all: () => ['departments'] as const,
    lists: () => ['departments', 'list'] as const,
    list: (filters: Record<string, any>) => ['departments', 'list', filters] as const,
    details: () => ['departments', 'detail'] as const,
    detail: (id: number) => ['departments', 'detail', id] as const,
  },

  // Entities
  entities: {
    all: () => ['entities'] as const,
    lists: () => ['entities', 'list'] as const,
    list: (filters: EntityFilters) => ['entities', 'list', filters] as const,
    details: () => ['entities', 'detail'] as const,
    detail: (id: number) => ['entities', 'detail', id] as const,
    qr: (code: string) => ['entities', 'qr', code] as const,
    images: (entityId: number) => ['entities', entityId, 'images'] as const,
    documents: (entityId: number) => ['entities', entityId, 'documents'] as const,
  },

  // Procedures
  procedures: {
    all: () => ['procedures'] as const,
    lists: () => ['procedures', 'list'] as const,
    list: (filters: ProcedureFilters) => ['procedures', 'list', filters] as const,
    details: () => ['procedures', 'detail'] as const,
    detail: (id: number) => ['procedures', 'detail', id] as const,
    steps: (procedureId: number) => ['procedures', procedureId, 'steps'] as const,
    templates: () => ['procedures', 'templates'] as const,
  },

  // Procedure Logs
  procedureLogs: {
    all: () => ['procedure-logs'] as const,
    lists: () => ['procedure-logs', 'list'] as const,
    list: (filters: ProcedureLogFilters) => ['procedure-logs', 'list', filters] as const,
    details: () => ['procedure-logs', 'detail'] as const,
    detail: (id: number) => ['procedure-logs', 'detail', id] as const,
    active: () => ['procedure-logs', 'active'] as const,
    byEntity: (entityId: number) => ['procedure-logs', 'entity', entityId] as const,
    byProcedure: (procedureId: number) => ['procedure-logs', 'procedure', procedureId] as const,
  },

  // Step Logs
  stepLogs: {
    all: () => ['step-logs'] as const,
    byProcedureLog: (logId: number) => ['step-logs', 'procedure-log', logId] as const,
  },

  // Issues
  issues: {
    all: () => ['issues'] as const,
    lists: () => ['issues', 'list'] as const,
    list: (filters: IssueFilters) => ['issues', 'list', filters] as const,
    details: () => ['issues', 'detail'] as const,
    detail: (id: number) => ['issues', 'detail', id] as const,
    comments: (issueId: number) => ['issues', issueId, 'comments'] as const,
  },

  // Notifications
  notifications: {
    all: () => ['notifications'] as const,
    lists: () => ['notifications', 'list'] as const,
    list: (filters: NotificationFilters) => ['notifications', 'list', filters] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },

  // Dashboard
  dashboard: {
    all: () => ['dashboard'] as const,
    stats: () => ['dashboard', 'stats'] as const,
    managerStats: () => ['dashboard', 'manager', 'stats'] as const,
    activity: () => ['dashboard', 'activity'] as const,
  },

  // Reports
  reports: {
    all: () => ['reports'] as const,
    lists: () => ['reports', 'list'] as const,
    list: (filters: Record<string, any>) => ['reports', 'list', filters] as const,
    details: () => ['reports', 'detail'] as const,
    detail: (id: number) => ['reports', 'detail', id] as const,
    schedules: () => ['reports', 'schedules'] as const,
  },
};
