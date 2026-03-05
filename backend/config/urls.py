from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    from django.db import connection
    from django.core.cache import cache
    checks = {'db': False, 'cache': False}
    try:
        connection.ensure_connection()
        checks['db'] = True
    except Exception:
        pass
    try:
        cache.set('_health', '1', 5)
        checks['cache'] = cache.get('_health') == '1'
    except Exception:
        pass
    ok = all(checks.values())
    return JsonResponse({'status': 'ok' if ok else 'degraded', **checks}, status=200 if ok else 503)


urlpatterns = [
    path('health/', health_check),
    path('admin/', admin.site.urls),
    path('api/v1/', include('api.v1.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
