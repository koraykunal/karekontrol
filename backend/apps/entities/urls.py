from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EntityViewSet, EntityImageViewSet, EntityDocumentViewSet, EntityShareViewSet

router = DefaultRouter()
router.register(r'entities', EntityViewSet, basename='entity')
router.register(r'entity-images', EntityImageViewSet, basename='entity-image')
router.register(r'entity-documents', EntityDocumentViewSet, basename='entity-document')
router.register(r'entity-shares', EntityShareViewSet, basename='entity-share')

urlpatterns = [
    path('', include(router.urls)),
]
