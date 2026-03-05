from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProcedureViewSet, ProcedureStepViewSet, ProcedureTemplateViewSet

router = DefaultRouter()
router.register(r'procedures', ProcedureViewSet, basename='procedure')
router.register(r'procedure-steps', ProcedureStepViewSet, basename='procedure-step')
router.register(r'procedure-templates', ProcedureTemplateViewSet, basename='procedure-template')

urlpatterns = [
    path('', include(router.urls)),
]
