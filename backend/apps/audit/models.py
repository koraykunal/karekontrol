from django.db import models
from apps.core.models import TimestampMixin


class AuditLog(TimestampMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True
    )
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=50, db_index=True)
    resource_id = models.PositiveIntegerField(blank=True, null=True)
    resource_title = models.CharField(max_length=255, blank=True, null=True)
    target_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='targeted_audit_logs'
    )
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    log_date = models.DateField(db_index=True)
    week_number = models.PositiveSmallIntegerField(blank=True, null=True)
    month_year = models.CharField(max_length=7, blank=True, null=True)
    request_path = models.CharField(max_length=500, blank=True, null=True)
    request_method = models.CharField(max_length=10, blank=True, null=True)
    status_code = models.PositiveSmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['log_date', 'organization']),
            models.Index(fields=['action', 'resource_type']),
            models.Index(fields=['user', 'log_date']),
            models.Index(fields=['resource_type', 'resource_id']),
            models.Index(fields=['organization', 'log_date']),
        ]
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        user_name = self.user.full_name if self.user else 'System'
        return f"{user_name} - {self.action} on {self.resource_type}"

    def save(self, *args, **kwargs):
        if not self.log_date:
            from django.utils import timezone
            self.log_date = timezone.now().date()

        if not self.week_number:
            self.week_number = self.log_date.isocalendar()[1]

        if not self.month_year:
            self.month_year = self.log_date.strftime('%Y-%m')

        super().save(*args, **kwargs)
