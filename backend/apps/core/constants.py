from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    ADMIN = 'ADMIN', 'Admin'
    MANAGER = 'MANAGER', 'Manager'
    WORKER = 'WORKER', 'Worker'


class ProcedurePriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


class IntervalUnit(models.TextChoices):
    DAYS = 'DAYS', 'Days'
    WEEKS = 'WEEKS', 'Weeks'
    MONTHS = 'MONTHS', 'Months'
    YEARS = 'YEARS', 'Years'


class ProcedureLogStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class IssueSeverity(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


class IssueStatus(models.TextChoices):
    OPEN = 'OPEN', 'Open'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    RESOLVED = 'RESOLVED', 'Resolved'
    VERIFIED = 'VERIFIED', 'Verified'
    ESCALATED = 'ESCALATED', 'Escalated'
    CLOSED = 'CLOSED', 'Closed'


class PermissionAction(models.TextChoices):
    VIEW = 'VIEW', 'View'
    CREATE = 'CREATE', 'Create'
    EDIT = 'EDIT', 'Edit'
    DELETE = 'DELETE', 'Delete'
    ASSIGN = 'ASSIGN', 'Assign'
    APPROVE = 'APPROVE', 'Approve'
    RESOLVE = 'RESOLVE', 'Resolve'


class PermissionScope(models.TextChoices):
    OWN = 'OWN', 'Own'
    DEPARTMENT = 'DEPARTMENT', 'Department'
    ORGANIZATION = 'ORGANIZATION', 'Organization'
    ALL = 'ALL', 'All'


class ResourceType(models.TextChoices):
    PROCEDURE = 'PROCEDURE', 'Procedure'
    ENTITY = 'ENTITY', 'Entity'
    DEPARTMENT = 'DEPARTMENT', 'Department'
    ORGANIZATION = 'ORGANIZATION', 'Organization'
    USER = 'USER', 'User'
    ISSUE = 'ISSUE', 'Issue'
    ASSIGNMENT = 'ASSIGNMENT', 'Assignment'


class AssignmentStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    REJECTED = 'REJECTED', 'Rejected'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    EXPIRED = 'EXPIRED', 'Expired'


class NotificationType(models.TextChoices):
    PROCEDURE_DUE = 'PROCEDURE_DUE', 'Procedure Due'
    PROCEDURE_OVERDUE = 'PROCEDURE_OVERDUE', 'Procedure Overdue'
    STEP_OVERDUE = 'STEP_OVERDUE', 'Step Overdue'
    NON_COMPLIANCE_REPORTED = 'NON_COMPLIANCE_REPORTED', 'Non-Compliance Reported'
    NON_COMPLIANCE_ASSIGNED = 'NON_COMPLIANCE_ASSIGNED', 'Non-Compliance Assigned'
    NON_COMPLIANCE_RESOLVED = 'NON_COMPLIANCE_RESOLVED', 'Non-Compliance Resolved'
    NON_COMPLIANCE_OVERDUE = 'NON_COMPLIANCE_OVERDUE', 'Non-Compliance Overdue'
    HELP_REQUEST_RECEIVED = 'HELP_REQUEST_RECEIVED', 'Help Request Received'
    HELP_REQUEST_RESPONDED = 'HELP_REQUEST_RESPONDED', 'Help Request Responded'
    NON_COMPLIANCE_COMMENT = 'NON_COMPLIANCE_COMMENT', 'Non-Compliance Comment'
    NON_COMPLIANCE_STATUS_CHANGED = 'NON_COMPLIANCE_STATUS_CHANGED', 'Non-Compliance Status Changed'
    ENTITY_SHARED = 'ENTITY_SHARED', 'Entity Shared'
    PROCEDURE_SHARED = 'PROCEDURE_SHARED', 'Procedure Shared'
    ASSIGNMENT_NEW = 'ASSIGNMENT_NEW', 'New Assignment'
    ASSIGNMENT_UPDATED = 'ASSIGNMENT_UPDATED', 'Assignment Updated'
    SYSTEM = 'SYSTEM', 'System'



class ReportType(models.TextChoices):
    DEPARTMENT = 'DEPARTMENT', 'Department'
    ORGANIZATION = 'ORGANIZATION', 'Organization'
    PROCEDURE = 'PROCEDURE', 'Procedure'
    COMPLIANCE = 'COMPLIANCE', 'Compliance'


class ReportTriggerType(models.TextChoices):
    AUTOMATIC = 'AUTOMATIC', 'Automatic'
    MANUAL = 'MANUAL', 'Manual'
    SCHEDULED = 'SCHEDULED', 'Scheduled'


class ReportStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    GENERATING = 'GENERATING', 'Generating'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'
