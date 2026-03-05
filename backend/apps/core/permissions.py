from rest_framework import permissions


class IsAuthenticatedAndActive(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active
        )


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            hasattr(request.user, 'role') and
            request.user.role == 'SUPER_ADMIN'
        )


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            hasattr(request.user, 'role') and
            request.user.role in ['SUPER_ADMIN', 'ADMIN']
        )


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            hasattr(request.user, 'role') and
            request.user.role in ['SUPER_ADMIN', 'ADMIN', 'MANAGER']
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'created_by'):
            return obj.created_by == request.user

        return False


class IsSameOrganization(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request, 'is_platform_owner') and request.is_platform_owner:
            return True

        return request.user.organization is not None

    def has_object_permission(self, request, view, obj):
        if hasattr(request, 'is_platform_owner') and request.is_platform_owner:
            return True

        if hasattr(obj, 'organization'):
            return obj.organization == request.user.organization

        return False


class CanManageOrganization(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.role in ['SUPER_ADMIN', 'ADMIN']

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'SUPER_ADMIN':
            return True

        if request.user.role == 'ADMIN':
            if hasattr(obj, 'organization'):
                return obj.organization == request.user.organization

        return False


class CanUpdateUser(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated or not request.user.is_active:
            return False

        if request.user.role == 'SUPER_ADMIN':
            return True

        if request.user.id == obj.id:
            return True

        if request.user.role == 'ADMIN' and obj.organization == request.user.organization:
            return True

        if request.user.role == 'MANAGER' and obj.department == request.user.department:
            return True

        return False


class CanDeleteUser(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated or not request.user.is_active:
            return False

        if request.user.role == 'SUPER_ADMIN':
            return True

        if request.user.role == 'ADMIN' and obj.organization == request.user.organization:
            return True

        return False
