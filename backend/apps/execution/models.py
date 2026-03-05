from django.db import models
from django.utils import timezone
from apps.core.models import TimestampMixin
from apps.core.constants import ProcedureLogStatus


class ProcedureLog(TimestampMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='procedure_logs'
    )
    entity = models.ForeignKey(
        'entities.Entity',
        on_delete=models.CASCADE,
        related_name='procedure_logs'
    )
    procedure = models.ForeignKey(
        'procedures.Procedure',
        on_delete=models.CASCADE,
        related_name='logs'
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='started_procedure_logs'
    )
    completed_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_procedure_logs'
    )
    status = models.CharField(
        max_length=20,
        choices=ProcedureLogStatus.choices,
        default=ProcedureLogStatus.IN_PROGRESS,
        db_index=True
    )
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(blank=True, null=True)
    next_procedure_date = models.DateField(blank=True, null=True, db_index=True)
    has_unresolved_issues = models.BooleanField(default=False)
    blocked_by_issues = models.BooleanField(default=False)
    blocking_issues_count = models.PositiveIntegerField(default=0)
    duration_minutes = models.PositiveIntegerField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    completion_percentage = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'procedure_logs'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['status', 'organization']),
            models.Index(fields=['next_procedure_date']),
            models.Index(fields=['entity', 'status']),
            models.Index(fields=['procedure', 'status']),
            models.Index(fields=['user', 'status']),
        ]
        verbose_name = 'Procedure Log'
        verbose_name_plural = 'Procedure Logs'

    def __str__(self):
        return f"{self.procedure.title} - {self.get_status_display()}"

    @property
    def is_overdue(self):
        if self.status == ProcedureLogStatus.COMPLETED:
            return False
        if self.next_procedure_date:
            return timezone.now().date() > self.next_procedure_date
        return False

    @property
    def duration_formatted(self):
        if not self.duration_minutes:
            return "N/A"
        total_minutes = self.duration_minutes
        days = total_minutes // (24 * 60)
        remaining = total_minutes % (24 * 60)
        hours = remaining // 60
        minutes = remaining % 60
        if days > 0:
            return f"{days}g {hours}s {minutes}dk"
        if hours > 0:
            return f"{hours}s {minutes}dk"
        return f"{minutes}dk"

    def calculate_duration(self):
        if self.completed_at and self.started_at:
            delta = self.completed_at - self.started_at
            self.duration_minutes = int(delta.total_seconds() / 60)
            self.save(update_fields=['duration_minutes'])


class StepLog(TimestampMixin):
    procedure_log = models.ForeignKey(
        ProcedureLog,
        on_delete=models.CASCADE,
        related_name='step_logs'
    )
    step = models.ForeignKey(
        'procedures.ProcedureStep',
        on_delete=models.CASCADE,
        related_name='logs'
    )
    completed_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    is_completed = models.BooleanField(default=False, db_index=True)
    is_compliant = models.BooleanField(default=True)
    completion_status = models.CharField(max_length=50, blank=True, null=True)
    has_blocking_issue = models.BooleanField(default=False)
    notes = models.TextField(max_length=1000, blank=True, null=True)
    photo_url = models.URLField(blank=True, null=True)
    photo_urls = models.JSONField(default=list, blank=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    checklist_results = models.JSONField(default=dict, blank=True)
    duration_minutes = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'step_logs'
        ordering = ['procedure_log', 'step__step_order']
        indexes = [
            models.Index(fields=['procedure_log', 'is_completed']),
            models.Index(fields=['step', 'is_completed']),
            models.Index(fields=['completed_by_user']),
        ]
        verbose_name = 'Step Log'
        verbose_name_plural = 'Step Logs'

    def __str__(self):
        return f"Step {self.step.step_order} - {self.step.title}"

    @property
    def completion_rate(self):
        if not self.checklist_results:
            return 100 if self.is_completed else 0

        total = len(self.checklist_results)
        if total == 0:
            return 100 if self.is_completed else 0

        completed = sum(1 for item in self.checklist_results.values() if item.get('checked', False))
        return int((completed / total) * 100)


class StepReminder(TimestampMixin):
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='step_reminders'
    )
    step_log = models.ForeignKey(
        StepLog,
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    procedure_log = models.ForeignKey(
        ProcedureLog,
        on_delete=models.CASCADE,
        related_name='step_reminders'
    )
    remind_at = models.DateTimeField(db_index=True)
    message = models.TextField()
    is_sent = models.BooleanField(default=False, db_index=True)
    sent_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'step_reminders'
        ordering = ['remind_at']
        indexes = [
            models.Index(fields=['user', 'is_sent']),
            models.Index(fields=['remind_at', 'is_sent']),
        ]
        verbose_name = 'Step Reminder'
        verbose_name_plural = 'Step Reminders'

    def __str__(self):
        return f"Reminder for {self.user.full_name} at {self.remind_at}"


class ProcedureShare(TimestampMixin):
    procedure_log = models.ForeignKey(
        ProcedureLog,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_with_department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.CASCADE,
        related_name='shared_procedure_logs'
    )
    shared_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='procedure_shares_created'
    )
    reason = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'procedure_shares'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['procedure_log', 'shared_with_department'],
                condition=models.Q(is_active=True),
                name='unique_active_procedure_share'
            )
        ]
        indexes = [
            models.Index(fields=['procedure_log', 'is_active']),
            models.Index(fields=['shared_with_department', 'is_active']),
        ]
        verbose_name = 'Procedure Share'
        verbose_name_plural = 'Procedure Shares'

    def __str__(self):
        return f"Procedure log shared with {self.shared_with_department.name}"


class Reminder(TimestampMixin):
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='reminders'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    scheduled_for = models.DateTimeField(db_index=True)
    is_completed = models.BooleanField(default=False, db_index=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    related_entity_type = models.CharField(max_length=50, blank=True, null=True)
    related_entity_id = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'reminders'
        ordering = ['scheduled_for', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_completed']),
            models.Index(fields=['scheduled_for', 'is_completed']),
        ]
        verbose_name = 'Reminder'
        verbose_name_plural = 'Reminders'

    def __str__(self):
        return f"{self.title} - {self.user.full_name}"

    def mark_as_completed(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=['is_completed', 'completed_at'])
