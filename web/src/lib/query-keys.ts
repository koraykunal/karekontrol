export const organizationKeys = {
    all: ['organizations'] as const,
    lists: () => [...organizationKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...organizationKeys.lists(), params] as const,
    details: () => [...organizationKeys.all, 'detail'] as const,
    detail: (id: number) => [...organizationKeys.details(), id] as const,
    select: () => [...organizationKeys.all, 'select'] as const,
    quota: (id: number) => [...organizationKeys.detail(id), 'quota'] as const,
}

export const departmentKeys = {
    all: ['departments'] as const,
    lists: () => [...departmentKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...departmentKeys.lists(), params] as const,
    byOrg: (orgId: number) => [...departmentKeys.lists(), { organization: orgId }] as const,
    details: () => [...departmentKeys.all, 'detail'] as const,
    detail: (id: number) => [...departmentKeys.details(), id] as const,
    select: (orgId?: number) => [...departmentKeys.all, 'select', orgId] as const,
}

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...userKeys.lists(), params] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: number) => [...userKeys.details(), id] as const,
}

export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    managerStats: () => [...dashboardKeys.all, 'manager-stats'] as const,
    activity: () => [...dashboardKeys.all, 'activity'] as const,
}

export const entityKeys = {
    all: ['entities'] as const,
    lists: () => [...entityKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...entityKeys.lists(), params] as const,
    details: () => [...entityKeys.all, 'detail'] as const,
    detail: (id: number) => [...entityKeys.details(), id] as const,
}

export const procedureKeys = {
    all: ['procedures'] as const,
    lists: () => [...procedureKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...procedureKeys.lists(), params] as const,
    details: () => [...procedureKeys.all, 'detail'] as const,
    detail: (id: number) => [...procedureKeys.details(), id] as const,
}

export const complianceKeys = {
    all: ['compliance'] as const,
    lists: () => [...complianceKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...complianceKeys.lists(), params] as const,
    details: () => [...complianceKeys.all, 'detail'] as const,
    detail: (id: number) => [...complianceKeys.details(), id] as const,
    comments: (id: number) => [...complianceKeys.detail(id), 'comments'] as const,
}

export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...notificationKeys.lists(), params] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

export const executionKeys = {
    all: ['execution'] as const,
    lists: () => [...executionKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...executionKeys.lists(), params] as const,
    details: () => [...executionKeys.all, 'detail'] as const,
    detail: (id: number) => [...executionKeys.details(), id] as const,
}

export const reportKeys = {
    all: ['reports'] as const,
    lists: () => [...reportKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...reportKeys.lists(), params] as const,
    details: () => [...reportKeys.all, 'detail'] as const,
    detail: (id: number) => [...reportKeys.details(), id] as const,
    schedules: () => [...reportKeys.all, 'schedules'] as const,
    schedule: (id: number) => [...reportKeys.schedules(), id] as const,
}
