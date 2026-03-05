from django.db import models
from apps.core.models import TimestampMixin
from apps.core.constants import NotificationType


class Notification(TimestampMixin):
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    entity = models.ForeignKey(
        'entities.Entity',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    procedure_log = models.ForeignKey(
        'execution.ProcedureLog',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    step_log = models.ForeignKey(
        'execution.StepLog',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    issue = models.ForeignKey(
        'compliance.NonComplianceIssue',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        db_index=True
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(
        max_length=20,
        choices=[
            ('LOW', 'Low'),
            ('NORMAL', 'Normal'),
            ('HIGH', 'High'),
            ('URGENT', 'Urgent')
        ],
        default='NORMAL'
    )
    is_read = models.BooleanField(default=False, db_index=True)
    is_persistent = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(blank=True, null=True)
    action_url = models.CharField(max_length=500, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'type']),
            models.Index(fields=['type', 'created_at']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"{self.title} - {self.user.full_name}"

    def mark_as_read(self):
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class PushToken(TimestampMixin):
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='push_tokens'
    )
    token = models.CharField(max_length=500)
    device_type = models.CharField(
        max_length=50,
        choices=[
            ('IOS', 'iOS'),
            ('ANDROID', 'Android'),
            ('WEB', 'Web')
        ],
        blank=True,
        null=True
    )
    device_name = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'push_tokens'
        ordering = ['-last_used_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'token'],
                name='unique_user_token'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['token']),
        ]
        verbose_name = 'Push Token'
        verbose_name_plural = 'Push Tokens'

    def __str__(self):
        return f"{self.user.full_name} - {self.device_type or 'Unknown'}"


class NotificationSchedule(TimestampMixin):
    notification_key = models.CharField(max_length=255, unique=True, db_index=True)
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices
    )
    target_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='notification_schedules'
    )
    procedure_log = models.ForeignKey(
        'execution.ProcedureLog',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    issue = models.ForeignKey(
        'compliance.NonComplianceIssue',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    last_sent_at = models.DateTimeField(null=True, blank=True)
    next_send_at = models.DateTimeField(db_index=True)
    repeat_interval_hours = models.PositiveIntegerField(default=24)
    send_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    target_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'notification_schedules'
        ordering = ['next_send_at']
        indexes = [
            models.Index(fields=['is_active', 'next_send_at']),
            models.Index(fields=['notification_type', 'is_active']),
            models.Index(fields=['target_user', 'is_active']),
        ]

    def __str__(self):
        return f"{self.notification_key} - {self.target_user.full_name}"


class NotificationPreference(TimestampMixin):
    user = models.OneToOneField(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='notification_preference'
    )
    procedure_due_enabled = models.BooleanField(default=True)
    procedure_overdue_enabled = models.BooleanField(default=True)
    issue_enabled = models.BooleanField(default=True)
    help_request_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    reminder_days_before = models.PositiveIntegerField(default=3)
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'notification_preferences'

    def __str__(self):
        return f"Preferences for {self.user.full_name}"

