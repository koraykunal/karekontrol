from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProcedureLogViewSet, StepLogViewSet, ReminderViewSet, StepReminderViewSet

router = DefaultRouter()
router.register(r'procedure-logs', ProcedureLogViewSet, basename='procedure-log')
router.register(r'step-logs', StepLogViewSet, basename='step-log')
router.register(r'reminders', ReminderViewSet, basename='reminder')
router.register(r'step-reminders', StepReminderViewSet, basename='step-reminder')

urlpatterns = [
    path('procedure-logs/<int:log_pk>/steps/<int:step_id>/complete/', 
         ProcedureLogViewSet.as_view({'post': 'complete_step_action'}), 
         name='procedure-log-complete-step'),
    path('procedure-logs/<int:log_pk>/steps/<int:step_id>/skip/', 
         ProcedureLogViewSet.as_view({'post': 'skip_step_action'}), 
         name='procedure-log-skip-step'),
    path('', include(router.urls)),
]

