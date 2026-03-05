export const UserRole = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    WORKER: 'WORKER',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ProcedurePriority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const
export type ProcedurePriority = (typeof ProcedurePriority)[keyof typeof ProcedurePriority]

export const IntervalUnit = {
    DAYS: 'DAYS',
    WEEKS: 'WEEKS',
    MONTHS: 'MONTHS',
    YEARS: 'YEARS',
} as const
export type IntervalUnit = (typeof IntervalUnit)[keyof typeof IntervalUnit]

export const ProcedureLogStatus = {
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const
export type ProcedureLogStatus = (typeof ProcedureLogStatus)[keyof typeof ProcedureLogStatus]

export const IssueSeverity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const
export type IssueSeverity = (typeof IssueSeverity)[keyof typeof IssueSeverity]

export const IssueStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    VERIFIED: 'VERIFIED',
    ESCALATED: 'ESCALATED',
    CLOSED: 'CLOSED',
} as const
export type IssueStatus = (typeof IssueStatus)[keyof typeof IssueStatus]

export const PermissionAction = {
    VIEW: 'VIEW',
    CREATE: 'CREATE',
    EDIT: 'EDIT',
    DELETE: 'DELETE',
    ASSIGN: 'ASSIGN',
    APPROVE: 'APPROVE',
    RESOLVE: 'RESOLVE',
} as const
export type PermissionAction = (typeof PermissionAction)[keyof typeof PermissionAction]

export const PermissionScope = {
    OWN: 'OWN',
    DEPARTMENT: 'DEPARTMENT',
    ORGANIZATION: 'ORGANIZATION',
    ALL: 'ALL',
} as const
export type PermissionScope = (typeof PermissionScope)[keyof typeof PermissionScope]

export const ResourceType = {
    PROCEDURE: 'PROCEDURE',
    ENTITY: 'ENTITY',
    DEPARTMENT: 'DEPARTMENT',
    ORGANIZATION: 'ORGANIZATION',
    USER: 'USER',
    ISSUE: 'ISSUE',
    ASSIGNMENT: 'ASSIGNMENT',
} as const
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType]

export const AssignmentStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    EXPIRED: 'EXPIRED',
} as const
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus]

export const NotificationType = {
    PROCEDURE_DUE: 'PROCEDURE_DUE',
    PROCEDURE_OVERDUE: 'PROCEDURE_OVERDUE',
    STEP_OVERDUE: 'STEP_OVERDUE',
    NON_COMPLIANCE_REPORTED: 'NON_COMPLIANCE_REPORTED',
    NON_COMPLIANCE_ASSIGNED: 'NON_COMPLIANCE_ASSIGNED',
    NON_COMPLIANCE_RESOLVED: 'NON_COMPLIANCE_RESOLVED',
    NON_COMPLIANCE_OVERDUE: 'NON_COMPLIANCE_OVERDUE',
    NON_COMPLIANCE_COMMENT: 'NON_COMPLIANCE_COMMENT',
    NON_COMPLIANCE_STATUS_CHANGED: 'NON_COMPLIANCE_STATUS_CHANGED',
    HELP_REQUEST_RECEIVED: 'HELP_REQUEST_RECEIVED',
    HELP_REQUEST_RESPONDED: 'HELP_REQUEST_RESPONDED',
    ENTITY_SHARED: 'ENTITY_SHARED',
    PROCEDURE_SHARED: 'PROCEDURE_SHARED',
    ASSIGNMENT_NEW: 'ASSIGNMENT_NEW',
    ASSIGNMENT_UPDATED: 'ASSIGNMENT_UPDATED',
    SYSTEM: 'SYSTEM',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const ReportType = {
    DEPARTMENT: 'DEPARTMENT',
    ORGANIZATION: 'ORGANIZATION',
    PROCEDURE: 'PROCEDURE',
    COMPLIANCE: 'COMPLIANCE',
} as const
export type ReportType = (typeof ReportType)[keyof typeof ReportType]

export const ReportTriggerType = {
    AUTOMATIC: 'AUTOMATIC',
    MANUAL: 'MANUAL',
    SCHEDULED: 'SCHEDULED',
} as const
export type ReportTriggerType = (typeof ReportTriggerType)[keyof typeof ReportTriggerType]

export const ReportStatus = {
    PENDING: 'PENDING',
    GENERATING: 'GENERATING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
} as const
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]

export const ENTITY_TYPES = ['EQUIPMENT', 'MACHINE', 'VEHICLE', 'BUILDING', 'ROOM', 'OTHER'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const ENTITY_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'] as const
export type EntityStatus = (typeof ENTITY_STATUSES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN: 'Süper Admin',
    ADMIN: 'Admin',
    MANAGER: 'Yönetici',
    WORKER: 'Çalışan',
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
    OPEN: 'Açık',
    IN_PROGRESS: 'Devam Ediyor',
    RESOLVED: 'Çözüldü',
    VERIFIED: 'Doğrulandı',
    ESCALATED: 'Yükseltildi',
    CLOSED: 'Kapatıldı',
}

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
    PENDING: 'Bekliyor',
    ACCEPTED: 'Kabul Edildi',
    REJECTED: 'Reddedildi',
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
    EXPIRED: 'Süresi Doldu',
}

export const PRIORITY_LABELS: Record<ProcedurePriority, string> = {
    LOW: 'Düşük',
    MEDIUM: 'Orta',
    HIGH: 'Yüksek',
    CRITICAL: 'Kritik',
}

export const PROCEDURE_LOG_STATUS_LABELS: Record<ProcedureLogStatus, string> = {
    IN_PROGRESS: 'Devam Ediyor',
    COMPLETED: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
}

export const COMPLETION_STATUS_LABELS: Record<string, string> = {
    COMPLIANT: 'Uyumlu',
    NON_COMPLIANT: 'Uyumsuz',
    SKIPPED: 'Atlandı',
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    DEPARTMENT: 'Departman Raporu',
    ORGANIZATION: 'Organizasyon Raporu',
    PROCEDURE: 'Prosedür Raporu',
    COMPLIANCE: 'Uyumluluk Raporu',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
    PENDING: 'Bekliyor',
    GENERATING: 'Oluşturuluyor',
    COMPLETED: 'Hazır',
    FAILED: 'Hatalı',
}
