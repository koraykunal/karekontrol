from django.db import models

from apps import entities, execution, authentication, organizations
from apps.core.models import TimestampMixin
from apps.core.constants import IssueSeverity, IssueStatus


class NonComplianceIssue(TimestampMixin):
    entity = models.ForeignKey(
        'entities.Entity',
        on_delete=models.CASCADE,
        related_name='issues'
    )
    procedure_log = models.ForeignKey(
        'execution.ProcedureLog',
        on_delete=models.CASCADE,
        related_name='issues'
    )
    step_log = models.ForeignKey(
        'execution.StepLog',
        on_delete=models.CASCADE,
        related_name='issues',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=IssueSeverity.choices,
        default=IssueSeverity.MEDIUM,
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=IssueStatus.choices,
        default=IssueStatus.OPEN,
        db_index=True
    )
    photo_urls = models.JSONField(default=list, blank=True)
    resolution_photo_urls = models.JSONField(default=list, blank=True)
    resolved_notes = models.TextField(blank=True, null=True)
    reported_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='reported_issues'
    )
    resolved_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_issues'
    )
    resolved_at = models.DateTimeField(blank=True, null=True)
    assigned_to_department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_issues'
    )
    assigned_to_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_issues'
    )
    due_date = models.DateField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'non_compliance_issues'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'severity']),
            models.Index(fields=['entity', 'status']),
            models.Index(fields=['assigned_to_department', 'status']),
            models.Index(fields=['assigned_to_user', 'status']),
            models.Index(fields=['due_date']),
        ]
        verbose_name = 'Non-Compliance Issue'
        verbose_name_plural = 'Non-Compliance Issues'

    def __str__(self):
        return f"{self.title} - {self.get_severity_display()}"

    @property
    def is_overdue(self):
        if self.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED]:
            return False
        if self.due_date:
            from django.utils import timezone
            return timezone.now().date() > self.due_date
        return False


class IssueComment(TimestampMixin):
    issue = models.ForeignKey(
        NonComplianceIssue,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True
    )
    content = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    is_internal = models.BooleanField(default=False)

    class Meta:
        db_table = 'issue_comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['issue', 'created_at']),
        ]
        verbose_name = 'Issue Comment'
        verbose_name_plural = 'Issue Comments'

    def __str__(self):
        return f"Comment by {self.user.full_name if self.user else 'Unknown'}"


class HelpRequest(TimestampMixin):
    issue = models.ForeignKey(
        NonComplianceIssue,
        on_delete=models.CASCADE,
        related_name='help_requests'
    )
    from_department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.CASCADE,
        related_name='help_requests_sent'
    )
    to_department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.CASCADE,
        related_name='help_requests_received'
    )
    requested_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='help_requests_created'
    )
    target_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='help_requests_targeted'
    )
    message = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('ACCEPTED', 'Accepted'),
            ('REJECTED', 'Rejected'),
            ('COMPLETED', 'Completed')
        ],
        default='PENDING',
        db_index=True
    )
    responded_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='help_requests_responded'
    )
    response_message = models.TextField(blank=True, null=True)
    responded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'help_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['to_department', 'status']),
            models.Index(fields=['from_department', 'status']),
            models.Index(fields=['target_user', 'status']),
        ]
        verbose_name = 'Help Request'
        verbose_name_plural = 'Help Requests'

    def __str__(self):
        return f"Help request from {self.from_department.name} to {self.to_department.name}"
