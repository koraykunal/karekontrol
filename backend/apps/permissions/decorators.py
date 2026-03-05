from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .engine import PermissionEngine


def require_permission(permission_key: str):
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            if not PermissionEngine.check(request.user, permission_key):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator


def require_object_permission(permission_key: str):
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            obj = self.get_object()
            if not PermissionEngine.check(request.user, permission_key, resource=obj):
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return func(self, request, *args, **kwargs)
        return wrapper
    return decorator
