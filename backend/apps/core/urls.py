from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardViewSet, UploadViewSet
from .bulk_views import BulkImportViewSet

router = DefaultRouter()
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'upload', UploadViewSet, basename='upload')
router.register(r'bulk-import', BulkImportViewSet, basename='bulk-import')

urlpatterns = [
    path('', include(router.urls)),
]
