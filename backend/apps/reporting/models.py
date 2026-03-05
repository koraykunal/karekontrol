from django.db import models
from apps.core.models import TimestampMixin
from apps.core.utils import get_organization_upload_path
from apps.core.constants import ReportType, ReportTriggerType, ReportStatus


class Report(TimestampMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='reports'
    )
    department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    report_type = models.CharField(
        max_length=50,
        choices=ReportType.choices
    )
    period_month = models.PositiveSmallIntegerField()
    period_year = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to=get_organization_upload_path, blank=True, null=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)
    generated_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True
    )
    triggered_by = models.CharField(
        max_length=20,
        choices=ReportTriggerType.choices
    )
    valid_from = models.DateField()
    valid_until = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=ReportStatus.choices,
        default=ReportStatus.PENDING,
        db_index=True
    )
    error_message = models.TextField(blank=True, null=True)
    total_procedures = models.PositiveIntegerField(default=0)
    completed_procedures = models.PositiveIntegerField(default=0)
    pending_procedures = models.PositiveIntegerField(default=0)
    non_compliance_count = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['department', 'status']),
            models.Index(fields=['report_type', 'status']),
            models.Index(fields=['period_year', 'period_month']),
        ]
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'

    def __str__(self):
        return f"{self.title} - {self.period_month}/{self.period_year}"


class ReportDistribution(TimestampMixin):
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name='distributions'
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE
    )
    distributed_at = models.DateTimeField(auto_now_add=True)
    download_count = models.PositiveIntegerField(default=0)
    last_downloaded_at = models.DateTimeField(blank=True, null=True)
    delivery_method = models.CharField(
        max_length=50,
        choices=[
            ('EMAIL', 'Email'),
            ('PUSH', 'Push Notification'),
            ('PORTAL', 'Portal')
        ],
        default='PORTAL'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('SENT', 'Sent'),
            ('FAILED', 'Failed')
        ],
        default='PENDING'
    )

    class Meta:
        db_table = 'report_distributions'
        ordering = ['-distributed_at']
        indexes = [
            models.Index(fields=['report', 'user']),
            models.Index(fields=['status']),
        ]
        verbose_name = 'Report Distribution'
        verbose_name_plural = 'Report Distributions'

    def __str__(self):
        return f"{self.report.title} to {self.user.full_name}"


class ReportSchedule(TimestampMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='report_schedules'
    )
    department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='report_schedules'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    report_type = models.CharField(
        max_length=50,
        choices=ReportType.choices
    )
    frequency = models.CharField(
        max_length=20,
        choices=[
            ('DAILY', 'Daily'),
            ('WEEKLY', 'Weekly'),
            ('MONTHLY', 'Monthly'),
            ('QUARTERLY', 'Quarterly'),
            ('ANNUAL', 'Annual')
        ],
        default='MONTHLY'
    )
    trigger_day_of_month = models.PositiveSmallIntegerField(default=1)
    trigger_hour = models.PositiveSmallIntegerField(default=0)
    trigger_minute = models.PositiveSmallIntegerField(default=0)
    timezone = models.CharField(max_length=50, default='UTC')
    recipient_email_list = models.JSONField(default=list)
    should_notify_department_head = models.BooleanField(default=True)
    should_notify_compliance_officer = models.BooleanField(default=False)
    last_run = models.DateTimeField(blank=True, null=True)
    next_run = models.DateTimeField(blank=True, null=True, db_index=True)

    class Meta:
        db_table = 'report_schedules'
        ordering = ['next_run']
        indexes = [
            models.Index(fields=['organization', 'is_active']),
            models.Index(fields=['next_run', 'is_active']),
        ]
        verbose_name = 'Report Schedule'
        verbose_name_plural = 'Report Schedules'

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.get_frequency_display()}"
