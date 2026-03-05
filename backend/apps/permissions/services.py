import warnings
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.core.cache import cache
from .models import UserPermission, RolePermissionConfig, ProcedureAssignment
from apps.core.constants import AssignmentStatus
from .engine import PermissionEngine


class PermissionService:
    @staticmethod
    def get_user_permissions(user):
        """Get all active permissions for a user"""
        return UserPermission.objects.filter(
            user=user,
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )

    @staticmethod
    def grant_permission(granted_by, user, resource_type, action, scope, **kwargs):
        """Grant a permission to a user"""
        return UserPermission.objects.create(
            granted_by_user=granted_by,
            user=user,
            resource_type=resource_type,
            action=action,
            scope=scope,
            **kwargs
        )

    @staticmethod
    def revoke_permission(permission_id, revoked_by=None):
        """Revoke a permission"""
        try:
            perm = UserPermission.objects.get(id=permission_id)
            perm.is_active = False
            perm.save(update_fields=['is_active'])
            return True
        except UserPermission.DoesNotExist:
            return False

    @staticmethod
    @transaction.atomic
    def assign_procedure(assigned_by, procedure, user, valid_from, **kwargs):
        """Assign a procedure to a user"""
        assignment = ProcedureAssignment.objects.create(
            assigned_by_user=assigned_by,
            procedure=procedure,
            assigned_to_user=user,
            valid_from=valid_from,
            status=AssignmentStatus.PENDING,
            **kwargs
        )

        from apps.notifications.tasks import send_assignment_notification
        transaction.on_commit(
            lambda: send_assignment_notification.delay(assignment.id, is_new=True)
        )

        return assignment

    @staticmethod
    @transaction.atomic
    def update_assignment_status(assignment_id, status, user):
        """Update status of a procedure assignment"""
        assignment = ProcedureAssignment.objects.get(id=assignment_id)
        # Verify user has permission to update status
        if assignment.assigned_to_user != user and user.role not in ['ADMIN', 'MANAGER']:
             from apps.core.exceptions import AuthorizationError
             raise AuthorizationError("Cannot update this assignment")

        assignment.status = status
        assignment.save(update_fields=['status'])

        from apps.notifications.tasks import send_assignment_notification
        transaction.on_commit(
            lambda: send_assignment_notification.delay(assignment.id, is_new=False)
        )

        return assignment

    @staticmethod
    def get_role_config(organization, role, department=None):
        """Get effective permission config for a role"""
        # Try department specific first
        if department:
            config = RolePermissionConfig.objects.filter(
                department=department,
                role=role,
                is_active=True
            ).first()
            if config:
                return config
        
        # Fallback to organization global
        return RolePermissionConfig.objects.filter(
            organization=organization,
            role=role,
            is_active=True,
            department__isnull=True
        ).first()

    @staticmethod
    def get_effective_permissions(user):
        warnings.warn(
            "PermissionService.get_effective_permissions() is deprecated. "
            "Use PermissionEngine.get_user_permissions() instead.",
            DeprecationWarning,
            stacklevel=2
        )
        return PermissionEngine.get_user_permissions(user)

    @staticmethod
    def invalidate_user_permissions_cache(user):
        warnings.warn(
            "PermissionService.invalidate_user_permissions_cache() is deprecated. "
            "Use PermissionEngine.invalidate_cache() instead.",
            DeprecationWarning,
            stacklevel=2
        )
        PermissionEngine.invalidate_cache(user)

    @staticmethod
    def invalidate_organization_permissions_cache(organization_id):
        warnings.warn(
            "PermissionService.invalidate_organization_permissions_cache() is deprecated. "
            "Use PermissionEngine.invalidate_all_caches() instead.",
            DeprecationWarning,
            stacklevel=2
        )
        PermissionEngine.invalidate_all_caches()

    @staticmethod
    def invalidate_department_permissions_cache(department_id):
        warnings.warn(
            "PermissionService.invalidate_department_permissions_cache() is deprecated. "
            "Use PermissionEngine.invalidate_all_caches() instead.",
            DeprecationWarning,
            stacklevel=2
        )
        PermissionEngine.invalidate_all_caches()

