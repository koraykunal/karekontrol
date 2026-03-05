from django.db import models
from django.core.exceptions import ValidationError
from apps.core.models import TimestampMixin
from apps.core.constants import PermissionAction, PermissionScope, ResourceType, AssignmentStatus, UserRole
from .enums import PermissionKey


class UserPermission(TimestampMixin):
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='custom_permissions'
    )
    resource_type = models.CharField(
        max_length=50,
        choices=ResourceType.choices,
        db_index=True
    )
    action = models.CharField(
        max_length=20,
        choices=PermissionAction.choices
    )
    resource_id = models.PositiveIntegerField(blank=True, null=True)
    scope = models.CharField(
        max_length=20,
        choices=PermissionScope.choices
    )
    granted_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='granted_permissions'
    )
    expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'user_permissions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'resource_type', 'action']),
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['scope']),
        ]
        verbose_name = 'User Permission'
        verbose_name_plural = 'User Permissions'

    def __str__(self):
        return f"{self.user.full_name} - {self.get_action_display()} {self.get_resource_type_display()}"


class RolePermissionConfig(TimestampMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='role_permission_configs'
    )
    department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='role_permission_configs'
    )
    role = models.CharField(max_length=50, db_index=True)
    permissions = models.JSONField(default=dict)
    configured_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True
    )
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = 'role_permission_configs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'role', 'is_active']),
            models.Index(fields=['department', 'role', 'is_active']),
        ]
        verbose_name = 'Role Permission Config'
        verbose_name_plural = 'Role Permission Configs'
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'role'],
                condition=models.Q(department__isnull=True),
                name='unique_org_role_config'
            ),
            models.UniqueConstraint(
                fields=['department', 'role'],
                condition=models.Q(department__isnull=False),
                name='unique_dept_role_config'
            )
        ]

    def __str__(self):
        level = "Global"
        if self.department:
            level = f"Department: {self.department.name}"
        elif self.organization:
            level = f"Organization: {self.organization.name}"
        return f"{self.role} - {level}"


class ProcedureAssignment(TimestampMixin):
    procedure = models.ForeignKey(
        'procedures.Procedure',
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    assigned_to_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='procedure_assignments'
    )
    assigned_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='assignments_created'
    )
    assignment_reason = models.TextField(blank=True, null=True)
    assignment_notes = models.TextField(blank=True, null=True)
    valid_from = models.DateField()
    valid_until = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=AssignmentStatus.choices,
        default=AssignmentStatus.PENDING,
        db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True)
    recurring = models.BooleanField(default=False)

    class Meta:
        db_table = 'procedure_assignments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['assigned_to_user', 'status']),
            models.Index(fields=['procedure', 'assigned_to_user']),
            models.Index(fields=['status', 'is_active']),
        ]
        verbose_name = 'Procedure Assignment'
        verbose_name_plural = 'Procedure Assignments'

    def __str__(self):
        return f"{self.procedure.title} assigned to {self.assigned_to_user.full_name}"


class PermissionPolicy(TimestampMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='permission_policies'
    )
    department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='permission_policies'
    )
    role = models.CharField(
        max_length=50,
        choices=UserRole.choices,
        db_index=True
    )
    permissions = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True, db_index=True)
    configured_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='configured_permission_policies'
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'permission_policies'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'role', 'is_active']),
            models.Index(fields=['department', 'role', 'is_active']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'role'],
                condition=models.Q(department__isnull=True, is_active=True),
                name='unique_active_org_role_policy'
            ),
            models.UniqueConstraint(
                fields=['department', 'role'],
                condition=models.Q(department__isnull=False, is_active=True),
                name='unique_active_dept_role_policy'
            )
        ]
        verbose_name = 'Permission Policy'
        verbose_name_plural = 'Permission Policies'

    def __str__(self):
        level = "Organization"
        location = self.organization.name
        if self.department:
            level = "Department"
            location = f"{self.department.name} ({self.organization.name})"
        return f"{self.get_role_display()} - {level}: {location}"

    def clean(self):
        super().clean()

        if not isinstance(self.permissions, dict):
            raise ValidationError({'permissions': 'Permissions must be a dictionary'})

        valid_keys = set(PermissionKey.values)
        for key, config in self.permissions.items():
            if key not in valid_keys:
                raise ValidationError({
                    'permissions': f'Invalid permission key: {key}. Must be one of {valid_keys}'
                })

            if not isinstance(config, dict):
                raise ValidationError({
                    'permissions': f'Permission config for {key} must be a dictionary'
                })

            if 'enabled' not in config:
                raise ValidationError({
                    'permissions': f'Permission config for {key} must have "enabled" field'
                })

            if not isinstance(config['enabled'], bool):
                raise ValidationError({
                    'permissions': f'Permission "enabled" field must be boolean for {key}'
                })

            if 'scope' in config:
                valid_scopes = set(PermissionScope.values)
                if config['scope'] not in valid_scopes:
                    raise ValidationError({
                        'permissions': f'Invalid scope "{config["scope"]}" for {key}. Must be one of {valid_scopes}'
                    })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
