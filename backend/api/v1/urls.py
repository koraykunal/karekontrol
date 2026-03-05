from django.urls import path, include

urlpatterns = [
    path('', include('apps.authentication.urls')),
    path('', include('apps.organizations.urls')),
    path('', include('apps.entities.urls')),
    path('', include('apps.procedures.urls')),
    path('', include('apps.notifications.urls')),
    path('', include('apps.execution.urls')),
    path('', include('apps.compliance.urls')),
    path('permissions/', include('apps.permissions.urls')),
    path('', include('apps.reporting.urls')),
    path('', include('apps.core.urls')),
]

