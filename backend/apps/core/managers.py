from django.db import models


class TenantManager(models.Manager):
    def __init__(self, *args, **kwargs):
        self.tenant_field = kwargs.pop('tenant_field', 'organization')
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        from django.contrib.auth.models import AnonymousUser
        from apps.core.thread_locals import get_current_request

        request = get_current_request()

        qs = super().get_queryset()

        if request and hasattr(request, 'user'):
            user = request.user
            if not isinstance(user, AnonymousUser) and user.is_authenticated:
                if hasattr(request, 'is_platform_owner') and request.is_platform_owner:
                    return qs
                elif hasattr(request, 'tenant') and request.tenant:
                    filter_kwargs = {self.tenant_field: request.tenant}
                    return qs.filter(**filter_kwargs)

        return qs.none()

    def all_organizations(self):
        return super().get_queryset()


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def deleted(self):
        return super().get_queryset().filter(is_deleted=True)

    def all_with_deleted(self):
        return super().get_queryset()
