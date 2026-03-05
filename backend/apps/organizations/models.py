from django.db import models
from apps.core.models import TimestampMixin


class Organization(TimestampMixin):
    name = models.CharField(max_length=200, unique=True, db_index=True)
    company_number = models.CharField(max_length=50, unique=True, db_index=True)
    registration_number = models.CharField(max_length=100, blank=True, null=True)
    qr_quota = models.PositiveIntegerField(default=0, help_text='0 = unlimited')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_sandbox = models.BooleanField(default=False, db_index=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'organizations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['company_number']),
        ]
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'

    def __str__(self):
        return self.name


class Department(TimestampMixin):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='departments'
    )
    manager = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_departments'
    )
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, null=True)
    code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'departments'
        ordering = ['organization', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'name'],
                name='unique_org_dept_name'
            )
        ]
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return f"{self.organization.name} - {self.name}"
