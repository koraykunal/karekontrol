import time
from django.utils.deprecation import MiddlewareMixin
from apps.core.exceptions import AuthorizationError
from apps.core.thread_locals import _thread_locals


class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request):
        _thread_locals.request = request
        if hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.role == 'SUPER_ADMIN':
                request.tenant = None
                request.is_platform_owner = True
            else:
                request.tenant = request.user.organization
                request.is_platform_owner = False
        else:
            request.tenant = None
            request.is_platform_owner = False
    
    def process_response(self, request, response):
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        if hasattr(request, 'user') and request.user.is_authenticated:
            org_id = view_kwargs.get('organization_id')

            if not org_id and request.method == 'GET':
                org_id = request.GET.get('organization_id')

            if not org_id and request.method in ('POST', 'PUT', 'PATCH') and hasattr(request, 'data'):
                org_id = request.data.get('organization_id')

            if org_id and not request.is_platform_owner:
                if request.tenant and str(request.tenant.id) != str(org_id):
                    raise AuthorizationError('You cannot access resources from another organization')

            if request.method in ('POST', 'PUT', 'PATCH') and hasattr(request, 'data') and not request.is_platform_owner:
                org_field = request.data.get('organization')
                if org_field and request.tenant and str(request.tenant.id) != str(org_field):
                    raise AuthorizationError('You cannot access resources from another organization')

        return None


class AuditMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        if request.method not in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return response

        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response

        try:
            from apps.audit.models import AuditLog
            from django.utils import timezone
            import re

            path = request.path
            match = re.match(r'^/api/v1/([^/]+)', path)
            resource_type = match.group(1) if match else 'unknown'

            resource_id = None
            if hasattr(request, 'resolver_match') and request.resolver_match:
                resource_id = request.resolver_match.kwargs.get('pk') or request.resolver_match.kwargs.get('id')

            if not resource_id and hasattr(response, 'data') and isinstance(response.data, dict):
                data = response.data.get('data', response.data)
                if isinstance(data, dict):
                    resource_id = data.get('id')

            if resource_id is not None:
                try:
                    resource_id = int(resource_id)
                except (ValueError, TypeError):
                    resource_id = None

            now = timezone.now()
            AuditLog.objects.create(
                user=request.user,
                action=request.method,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip() or None,
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500] or None,
                request_path=path,
                request_method=request.method,
                status_code=response.status_code,
                log_date=now.date(),
                organization=getattr(request.user, 'organization', None),
                department=getattr(request.user, 'department', None),
            )
        except Exception:
            pass

        return response
