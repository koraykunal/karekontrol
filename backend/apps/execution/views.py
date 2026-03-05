from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.core.permissions import IsAuthenticatedAndActive
from django.utils import timezone

from apps.core.pagination import StandardResultsSetPagination
from .models import ProcedureLog, StepLog, ProcedureShare, Reminder, StepReminder
from .serializers import (
    ProcedureLogSerializer, ProcedureLogListSerializer, ProcedureLogCreateSerializer,
    StepLogSerializer, StepLogUpdateSerializer, ProcedureShareSerializer,
    ReminderSerializer, ReminderCreateSerializer, ReminderUpdateSerializer
)
from .services import ExecutionService
from apps.core.constants import ProcedureLogStatus


class ProcedureLogViewSet(viewsets.ModelViewSet):
    queryset = ProcedureLog.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'entity', 'procedure', 'user']
    search_fields = ['procedure__title', 'entity__name', 'notes']
    ordering_fields = ['started_at', 'status']
    ordering = ['-started_at']

    def get_queryset(self):
        qs = ExecutionService.get_logs_for_user(self.request.user)
        return qs.select_related(
            'procedure', 'entity', 'user', 'completed_by_user', 
            'organization', 'entity__organization', 'entity__department'
        ).prefetch_related(
            'step_logs', 'step_logs__step', 'step_logs__completed_by_user',
            'step_logs__issues' 
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return ProcedureLogListSerializer
        elif self.action in ['create', 'start']:
            return ProcedureLogCreateSerializer
        return ProcedureLogSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        log = ExecutionService.start_procedure(
            user=request.user,
            **serializer.validated_data
        )

        return Response({
            'success': True,
            'message': 'Prosedür başlatıldı',
            'data': ProcedureLogSerializer(log, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        log = self.get_object()
        ExecutionService.complete_procedure(log, request.user)
        
        return Response({
            'success': True,
            'message': 'Prosedür tamamlandı',
            'data': ProcedureLogSerializer(log).data
        })

    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        log = self.get_object()
        department_id = request.data.get('department_id')
        reason = request.data.get('reason')

        try:
            from apps.organizations.models import Department
            department = Department.objects.get(id=department_id)

            # Organization validation - prevent cross-org sharing
            if request.user.role != 'SUPER_ADMIN':
                if department.organization != request.user.organization:
                    return Response({
                        'success': False,
                        'message': 'Cannot share with departments in other organizations'
                    }, status=status.HTTP_403_FORBIDDEN)

            share = ExecutionService.share_log(log, department, request.user, reason)

            return Response({
                'success': True,
                'message': 'Prosedür logu paylaşıldı',
                'data': ProcedureShareSerializer(share).data
            })
        except Department.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Departman bulunamadı'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path=r'(?P<log_pk>\d+)/steps/(?P<step_id>\d+)/complete')
    def complete_step_action(self, request, log_pk=None, step_id=None):
        try:
            # Security fix: Access through service to ensure permissions (Y-B05)
            log = ExecutionService.get_logs_for_user(request.user).get(id=log_pk)
        except ProcedureLog.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Prosedür logu bulunamadı'
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            step_log = StepLog.objects.get(procedure_log=log, id=step_id)
        except StepLog.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Adım logu bulunamadı'
            }, status=status.HTTP_404_NOT_FOUND)

        completion_status = request.data.get('completion_status', 'COMPLIANT')
        notes = request.data.get('notes')
        photo_urls = request.data.get('photo_urls', [])

        step_log = ExecutionService.complete_step(
            step_log,
            request.user,
            completion_status=completion_status,
            notes=notes,
            photo_urls=photo_urls
        )

        return Response({
            'success': True,
            'message': 'Adım tamamlandı',
            'data': StepLogSerializer(step_log).data
        })

    @action(detail=False, methods=['post'], url_path=r'(?P<log_pk>\d+)/steps/(?P<step_id>\d+)/skip')
    def skip_step_action(self, request, log_pk=None, step_id=None):
        try:
            log = ExecutionService.get_logs_for_user(request.user).get(id=log_pk)
        except ProcedureLog.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Prosedür logu bulunamadı'
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            step_log = StepLog.objects.get(procedure_log=log, id=step_id)
        except StepLog.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Adım logu bulunamadı'
            }, status=status.HTTP_404_NOT_FOUND)

        notes = request.data.get('notes', 'Adım atlandı')
        step_log = ExecutionService.skip_step(step_log, request.user, notes)

        return Response({
            'success': True,
            'message': 'Adım atlandı',
            'data': StepLogSerializer(step_log).data
        })

    @action(detail=True, methods=['get'], url_path='check-newer')
    def check_newer(self, request, pk=None):
        log = self.get_object()
        newer = ProcedureLog.objects.filter(
            organization=log.organization,
            procedure_id=log.procedure_id,
            entity_id=log.entity_id,
            created_at__gt=log.created_at
        ).exclude(
            status=ProcedureLogStatus.CANCELLED
        ).order_by('created_at').first()
        
        return Response({
            'has_newer': newer is not None,
            'newer_id': newer.id if newer else None,
            'status': newer.status if newer else None
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        log = self.get_object()
        notes = request.data.get('notes', 'Prosedür iptal edildi')

        ExecutionService.cancel_procedure(log, request.user, notes)

        return Response({
            'success': True,
            'message': 'Prosedür iptal edildi',
            'data': ProcedureLogSerializer(log).data
        })


class StepLogViewSet(viewsets.ModelViewSet):
    queryset = StepLog.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = StepLogSerializer
    http_method_names = ['get', 'put', 'patch']

    def get_queryset(self):
        # Users can see steps for logs they can see
        return StepLog.objects.filter(
            procedure_log__in=ExecutionService.get_logs_for_user(self.request.user)
        ).select_related(
            'procedure_log', 'procedure_log__procedure', 'step', 'completed_by_user'
        ).prefetch_related(
            'issues'
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = StepLogUpdateSerializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        step_log = ExecutionService.complete_step(instance, request.user, **serializer.validated_data)
        
        return Response({
            'success': True,
            'message': 'Adım güncellendi',
            'data': StepLogSerializer(step_log).data
        })


class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_completed', 'scheduled_for']
    search_fields = ['title', 'description']
    ordering_fields = ['scheduled_for', 'created_at']
    ordering = ['scheduled_for']

    def get_serializer_class(self):
        if self.action == 'create':
            return ReminderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReminderUpdateSerializer
        return ReminderSerializer

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Hatırlatıcı silindi'
        }, status=status.HTTP_200_OK)


class StepReminderViewSet(viewsets.ModelViewSet):
    queryset = StepReminder.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_sent', 'step_log', 'procedure_log']
    ordering_fields = ['remind_at', 'created_at']
    ordering = ['remind_at']

    def get_serializer_class(self):
        from .serializers import StepReminderSerializer, StepReminderCreateSerializer
        if self.action == 'create':
            return StepReminderCreateSerializer
        return StepReminderSerializer

    def get_queryset(self):
        return StepReminder.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        from .serializers import StepReminderSerializer, StepReminderCreateSerializer
        serializer = StepReminderCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        reminder = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Hatırlatıcı oluşturuldu',
            'data': StepReminderSerializer(reminder).data
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({
            'success': True,
            'message': 'Hatırlatıcı silindi'
        }, status=status.HTTP_200_OK)

