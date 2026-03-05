from typing import Optional, Dict, Any
from django.core.cache import cache
from django.db.models import Q, QuerySet
from apps.core.constants import UserRole, PermissionScope
from .enums import PermissionKey


class PermissionEngine:
    CACHE_TTL = 300
    CACHE_PREFIX = 'permissions'

    @staticmethod
    def _get_cache_key(user_id: int) -> str:
        return f'{PermissionEngine.CACHE_PREFIX}:user:{user_id}'

    @staticmethod
    def get_user_permissions(user) -> Dict[str, Dict[str, Any]]:
        if not user or not user.is_authenticated:
            return {}

        cache_key = PermissionEngine._get_cache_key(user.id)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        if user.is_super_admin:
            permissions = PermissionEngine._get_super_admin_permissions()
        else:
            permissions = PermissionEngine._get_policy_permissions(user)
            if not permissions:
                permissions = PermissionEngine._get_role_defaults(user.role)

        cache.set(cache_key, permissions, PermissionEngine.CACHE_TTL)
        return permissions

    @staticmethod
    def _get_policy_permissions(user) -> Dict[str, Dict[str, Any]]:
        from .models import PermissionPolicy

        policy = None

        if user.department_id:
            policy = PermissionPolicy.objects.filter(
                department_id=user.department_id,
                role=user.role,
                is_active=True
            ).first()

        if not policy and user.organization_id:
            policy = PermissionPolicy.objects.filter(
                organization_id=user.organization_id,
                department__isnull=True,
                role=user.role,
                is_active=True
            ).first()

        return policy.permissions if policy else {}

    @staticmethod
    def _get_super_admin_permissions() -> Dict[str, Dict[str, Any]]:
        permissions = {}
        for key in PermissionKey.values:
            permissions[key] = {
                'enabled': True,
                'scope': PermissionScope.ALL
            }
        return permissions

    @staticmethod
    def _get_role_defaults(role: str) -> Dict[str, Dict[str, Any]]:
        if role == UserRole.SUPER_ADMIN:
            return PermissionEngine._get_super_admin_permissions()

        permissions = {}

        if role == UserRole.ADMIN:
            permissions = {
                PermissionKey.VIEW_ENTITIES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.CREATE_ENTITIES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_ENTITIES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.DELETE_ENTITIES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.VIEW_USERS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.CREATE_USERS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_USERS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.DELETE_USERS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.CHANGE_USER_ROLES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.VIEW_PROCEDURES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.CREATE_PROCEDURES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_PROCEDURES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.DELETE_PROCEDURES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.ASSIGN_PROCEDURES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.VIEW_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.CREATE_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.DELETE_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.VIEW_ISSUES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.CREATE_ISSUES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_ISSUES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.DELETE_ISSUES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.RESOLVE_ISSUES: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.VIEW_DEPARTMENTS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.CREATE_DEPARTMENTS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_DEPARTMENTS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.DELETE_DEPARTMENTS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.VIEW_ORGANIZATIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_ORGANIZATIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.ACCESS_REPORTS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EXPORT_REPORTS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.VIEW_ANALYTICS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.ACCESS_MANAGEMENT: {'enabled': True},
                PermissionKey.CONFIGURE_PERMISSIONS: {'enabled': False},
                PermissionKey.VIEW_AUDIT_LOGS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
            }
        elif role == UserRole.MANAGER:
            permissions = {
                PermissionKey.VIEW_ENTITIES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_ENTITIES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.EDIT_ENTITIES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.DELETE_ENTITIES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.VIEW_USERS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_USERS: {'enabled': False},
                PermissionKey.EDIT_USERS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.DELETE_USERS: {'enabled': False},
                PermissionKey.CHANGE_USER_ROLES: {'enabled': False},
                PermissionKey.VIEW_PROCEDURES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_PROCEDURES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.EDIT_PROCEDURES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.DELETE_PROCEDURES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.ASSIGN_PROCEDURES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.VIEW_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.EDIT_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.DELETE_EXECUTIONS: {'enabled': False},
                PermissionKey.VIEW_ISSUES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_ISSUES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.EDIT_ISSUES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.DELETE_ISSUES: {'enabled': False},
                PermissionKey.RESOLVE_ISSUES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.VIEW_DEPARTMENTS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_DEPARTMENTS: {'enabled': False},
                PermissionKey.EDIT_DEPARTMENTS: {'enabled': False},
                PermissionKey.DELETE_DEPARTMENTS: {'enabled': False},
                PermissionKey.VIEW_ORGANIZATIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_ORGANIZATIONS: {'enabled': False},
                PermissionKey.ACCESS_REPORTS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.EXPORT_REPORTS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.VIEW_ANALYTICS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.ACCESS_MANAGEMENT: {'enabled': True},
                PermissionKey.CONFIGURE_PERMISSIONS: {'enabled': False},
                PermissionKey.VIEW_AUDIT_LOGS: {'enabled': False},
            }
        elif role == UserRole.WORKER:
            permissions = {
                PermissionKey.VIEW_ENTITIES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_ENTITIES: {'enabled': False},
                PermissionKey.EDIT_ENTITIES: {'enabled': False},
                PermissionKey.DELETE_ENTITIES: {'enabled': False},
                PermissionKey.VIEW_USERS: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_USERS: {'enabled': False},
                PermissionKey.EDIT_USERS: {'enabled': False},
                PermissionKey.DELETE_USERS: {'enabled': False},
                PermissionKey.CHANGE_USER_ROLES: {'enabled': False},
                PermissionKey.VIEW_PROCEDURES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_PROCEDURES: {'enabled': False},
                PermissionKey.EDIT_PROCEDURES: {'enabled': False},
                PermissionKey.DELETE_PROCEDURES: {'enabled': False},
                PermissionKey.ASSIGN_PROCEDURES: {'enabled': False},
                PermissionKey.VIEW_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.OWN},
                PermissionKey.CREATE_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.OWN},
                PermissionKey.EDIT_EXECUTIONS: {'enabled': True, 'scope': PermissionScope.OWN},
                PermissionKey.DELETE_EXECUTIONS: {'enabled': False},
                PermissionKey.VIEW_ISSUES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.CREATE_ISSUES: {'enabled': True, 'scope': PermissionScope.DEPARTMENT},
                PermissionKey.EDIT_ISSUES: {'enabled': True, 'scope': PermissionScope.OWN},
                PermissionKey.DELETE_ISSUES: {'enabled': False},
                PermissionKey.RESOLVE_ISSUES: {'enabled': False},
                PermissionKey.VIEW_DEPARTMENTS: {'enabled': True, 'scope': PermissionScope.OWN},
                PermissionKey.CREATE_DEPARTMENTS: {'enabled': False},
                PermissionKey.EDIT_DEPARTMENTS: {'enabled': False},
                PermissionKey.DELETE_DEPARTMENTS: {'enabled': False},
                PermissionKey.VIEW_ORGANIZATIONS: {'enabled': True, 'scope': PermissionScope.ORGANIZATION},
                PermissionKey.EDIT_ORGANIZATIONS: {'enabled': False},
                PermissionKey.ACCESS_REPORTS: {'enabled': False},
                PermissionKey.EXPORT_REPORTS: {'enabled': False},
                PermissionKey.VIEW_ANALYTICS: {'enabled': False},
                PermissionKey.ACCESS_MANAGEMENT: {'enabled': False},
                PermissionKey.CONFIGURE_PERMISSIONS: {'enabled': False},
                PermissionKey.VIEW_AUDIT_LOGS: {'enabled': False},
            }

        return permissions

    @staticmethod
    def check(user, permission_key: str, resource=None) -> bool:
        permissions = PermissionEngine.get_user_permissions(user)
        perm_config = permissions.get(permission_key, {})

        if not perm_config.get('enabled', False):
            return False

        if resource is None:
            return True

        scope = perm_config.get('scope')
        if not scope:
            return True

        return PermissionEngine._check_scope(user, resource, scope)

    @staticmethod
    def _check_scope(user, resource, scope: str) -> bool:
        if scope == PermissionScope.ALL:
            return True

        if scope == PermissionScope.ORGANIZATION:
            resource_org_id = getattr(resource, 'organization_id', None)
            return resource_org_id == user.organization_id

        if scope == PermissionScope.DEPARTMENT:
            resource_dept_id = getattr(resource, 'department_id', None)
            if resource_dept_id is None and hasattr(resource, 'entity'):
                resource_dept_id = getattr(resource.entity, 'department_id', None)
            return resource_dept_id == user.department_id

        if scope == PermissionScope.OWN:
            created_by_id = getattr(resource, 'created_by_id', None)
            assigned_to_id = getattr(resource, 'assigned_to_user_id', None)
            user_id = getattr(resource, 'user_id', None)
            return user.id in [created_by_id, assigned_to_id, user_id]

        return False

    @staticmethod
    def filter_queryset(queryset: QuerySet, user, permission_key: str) -> QuerySet:
        permissions = PermissionEngine.get_user_permissions(user)
        perm_config = permissions.get(permission_key, {})

        if not perm_config.get('enabled', False):
            return queryset.none()

        scope = perm_config.get('scope')
        if not scope or scope == PermissionScope.ALL:
            return queryset

        model = queryset.model

        if scope == PermissionScope.ORGANIZATION:
            return queryset.filter(organization_id=user.organization_id)

        if scope == PermissionScope.DEPARTMENT:
            if hasattr(model, 'department_id') or 'department' in [f.name for f in model._meta.get_fields()]:
                return queryset.filter(department_id=user.department_id)
            elif hasattr(model, 'entity'):
                return queryset.filter(entity__department_id=user.department_id)
            else:
                return queryset.filter(department_id=user.department_id)

        if scope == PermissionScope.OWN:
            filters = Q()
            if 'created_by' in [f.name for f in model._meta.get_fields()]:
                filters |= Q(created_by_id=user.id)
            if 'assigned_to_user' in [f.name for f in model._meta.get_fields()]:
                filters |= Q(assigned_to_user_id=user.id)
            if 'user' in [f.name for f in model._meta.get_fields()]:
                filters |= Q(user_id=user.id)

            if filters:
                return queryset.filter(filters)
            return queryset.none()

        return queryset

    @staticmethod
    def invalidate_cache(user):
        if user and user.id:
            cache_key = PermissionEngine._get_cache_key(user.id)
            cache.delete(cache_key)

    @staticmethod
    def invalidate_all_caches():
        try:
            if hasattr(cache, 'delete_pattern'):
                cache.delete_pattern(f'{PermissionEngine.CACHE_PREFIX}:*')
            else:
                from apps.authentication.models import User
                user_ids = User.objects.filter(is_active=True).values_list('id', flat=True)
                keys = [PermissionEngine._get_cache_key(uid) for uid in user_ids]
                if keys:
                    cache.delete_many(keys)
        except Exception:
            pass
