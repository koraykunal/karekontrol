from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NonComplianceIssueViewSet, HelpRequestViewSet

router = DefaultRouter()
router.register(r'issues', NonComplianceIssueViewSet, basename='issue')
router.register(r'help-requests', HelpRequestViewSet, basename='help-request')

urlpatterns = [
    path('', include(router.urls)),
]
