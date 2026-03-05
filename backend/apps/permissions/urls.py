from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProcedureAssignmentViewSet,
    PermissionPolicyViewSet
)

router = DefaultRouter()
router.register(r'procedure-assignments', ProcedureAssignmentViewSet, basename='procedure-assignment')
router.register(r'policies', PermissionPolicyViewSet, basename='permission-policy')

urlpatterns = [
    path('', include(router.urls)),
]
