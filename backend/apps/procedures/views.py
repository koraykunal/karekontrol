from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.db.models import Count, Q, Prefetch, Max, OuterRef, Subquery, IntegerField, Value
from django.db.models.functions import Coalesce

from apps.core.permissions import IsAuthenticatedAndActive, IsAdmin, IsManager
from apps.core.pagination import StandardResultsSetPagination
from apps.permissions.permissions import (
    CanViewProcedures, CanCreateProcedures, CanEditProcedures, CanDeleteProcedures
)
from .models import Procedure, ProcedureStep, ProcedureTemplate
from .serializers import (
    ProcedureSerializer, ProcedureListSerializer, ProcedureCreateSerializer, ProcedureUpdateSerializer,
    ProcedureStepSerializer, ProcedureStepCreateSerializer,
    ProcedureTemplateSerializer, ProcedureTemplateListSerializer, ProcedureTemplateCreateSerializer,
    ProcedureFromTemplateSerializer
)
from .services import ProcedureService, ProcedureStepService, ProcedureTemplateService


class ProcedureViewSet(viewsets.ModelViewSet):
    queryset = Procedure.objects.filter(is_deleted=False)
    permission_classes = [IsAuthenticatedAndActive, CanViewProcedures]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['organization', 'entity', 'priority', 'is_active']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'title', 'priority']
    ordering = ['-priority', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProcedureListSerializer
        elif self.action == 'create':
            return ProcedureCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProcedureUpdateSerializer
        elif self.action == 'create_from_template':
            return ProcedureFromTemplateSerializer
        return ProcedureSerializer

    def get_queryset(self):
        queryset = ProcedureService.get_procedures_for_user(self.request.user)

        queryset = queryset.select_related('entity', 'organization')

        if self.action == 'list':
            from apps.core.constants import IssueStatus, ProcedureLogStatus
            from apps.execution.models import ProcedureLog
            from apps.compliance.models import NonComplianceIssue

            open_issue_subq = (
                NonComplianceIssue.objects
                .filter(step_log__procedure_log__procedure=OuterRef('pk'))
                .exclude(status__in=[IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED])
                .values('step_log__procedure_log__procedure')
                .annotate(c=Count('pk'))
                .values('c')
            )

            queryset = queryset.prefetch_related(
                Prefetch(
                    'logs',
                    queryset=ProcedureLog.objects.filter(
                        status=ProcedureLogStatus.COMPLETED
                    ).order_by('-completed_at'),
                    to_attr='completed_logs'
                ),
                'steps',
            ).annotate(
                open_issue_count=Coalesce(
                    Subquery(open_issue_subq, output_field=IntegerField()),
                    Value(0),
                )
            )
        elif self.action == 'retrieve':
            queryset = queryset.prefetch_related('steps')

        return queryset

    def get_permissions(self):
        permission_map = {
            'create': [IsAuthenticatedAndActive(), CanCreateProcedures()],
            'create_from_template': [IsAuthenticatedAndActive(), CanCreateProcedures()],
            'update': [IsAuthenticatedAndActive(), CanEditProcedures()],
            'partial_update': [IsAuthenticatedAndActive(), CanEditProcedures()],
            'destroy': [IsAuthenticatedAndActive(), CanDeleteProcedures()],
        }
        return permission_map.get(self.action, super().get_permissions())

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        steps_data = data.pop('steps', [])

        procedure = ProcedureService.create_procedure(
            created_by=request.user,
            steps_data=steps_data,
            **data
        )

        return Response({
            'success': True,
            'message': 'Procedure created successfully',
            'data': ProcedureSerializer(procedure).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)

        procedure = ProcedureService.update_procedure(instance, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Procedure updated successfully',
            'data': ProcedureSerializer(procedure).data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        ProcedureService.soft_delete_procedure(instance)

        return Response({
            'success': True,
            'message': 'Procedure deleted successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='restore', permission_classes=[IsAdmin])
    def restore(self, request, pk=None):
        queryset = Procedure.objects.filter(id=pk)
        if request.user.role != 'SUPER_ADMIN':
            queryset = queryset.filter(organization=request.user.organization)

        procedure = queryset.first()
        if not procedure:
            return Response({
                'success': False,
                'message': 'Procedure not found'
            }, status=status.HTTP_404_NOT_FOUND)

        ProcedureService.restore_procedure(procedure)

        return Response({
            'success': True,
            'message': 'Procedure restored successfully',
            'data': ProcedureSerializer(procedure).data
        })

    @action(detail=True, methods=['post'], url_path='activate', permission_classes=[IsManager])
    def activate(self, request, pk=None):
        procedure = self.get_object()
        ProcedureService.activate_procedure(procedure)

        return Response({
            'success': True,
            'message': 'Procedure activated successfully',
            'data': ProcedureSerializer(procedure).data
        })

    @action(detail=True, methods=['post'], url_path='deactivate', permission_classes=[IsManager])
    def deactivate(self, request, pk=None):
        procedure = self.get_object()
        ProcedureService.deactivate_procedure(procedure)

        return Response({
            'success': True,
            'message': 'Procedure deactivated successfully',
            'data': ProcedureSerializer(procedure).data
        })

    @action(detail=False, methods=['post'], url_path='from-template', permission_classes=[IsManager])
    def create_from_template(self, request):
        serializer = ProcedureFromTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            template = ProcedureTemplate.objects.get(id=serializer.validated_data['template_id'])
        except ProcedureTemplate.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Template not found'
            }, status=status.HTTP_404_NOT_FOUND)

        from apps.entities.models import Entity
        try:
            entity_qs = Entity.objects.all()
            if request.user.organization:
                entity_qs = entity_qs.filter(organization=request.user.organization)
            entity = entity_qs.get(id=serializer.validated_data['entity_id'])
        except Entity.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Entity not found'
            }, status=status.HTTP_404_NOT_FOUND)

        title = serializer.validated_data.get('title')
        procedure = ProcedureService.create_from_template(template, entity, request.user, title)

        return Response({
            'success': True,
            'message': 'Procedure created from template successfully',
            'data': ProcedureSerializer(procedure).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='create-template', permission_classes=[IsManager])
    def create_template(self, request, pk=None):
        procedure = self.get_object()
        name = request.data.get('name')
        is_public = request.data.get('is_public', False)

        template = ProcedureTemplateService.create_template_from_procedure(procedure, name, is_public)

        return Response({
            'success': True,
            'message': 'Template created from procedure successfully',
            'data': ProcedureTemplateSerializer(template).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='steps')
    def steps(self, request, pk=None):
        procedure = self.get_object()
        steps = procedure.steps.all()
        serializer = ProcedureStepSerializer(steps, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='add-step', permission_classes=[IsManager])
    def add_step(self, request, pk=None):
        procedure = self.get_object()
        serializer = ProcedureStepCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        step = ProcedureStepService.create_step(procedure, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Step added successfully',
            'data': ProcedureStepSerializer(step).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='reorder-steps', permission_classes=[IsManager])
    def reorder_steps(self, request, pk=None):
        procedure = self.get_object()
        step_orders = request.data.get('step_orders', [])
        
        if not step_orders:
            return Response({
                'success': False,
                'message': 'Adım sıralaması belirtilmedi'
            }, status=status.HTTP_400_BAD_REQUEST)

        for item in step_orders:
            if not isinstance(item, dict) or 'id' not in item or 'order' not in item:
                return Response({
                    'success': False,
                    'message': 'Her eleman id ve order alanları içermelidir'
                }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for item in step_orders:
                ProcedureStep.objects.filter(
                    procedure=procedure,
                    id=item['id']
                ).update(step_order=item['order'] + 10000)

            for item in step_orders:
                ProcedureStep.objects.filter(
                    procedure=procedure,
                    id=item['id']
                ).update(step_order=item['order'])

        steps = procedure.steps.all()
        return Response({
            'success': True,
            'message': 'Adımlar yeniden sıralandı',
            'data': ProcedureStepSerializer(steps, many=True).data
        })


class ProcedureStepViewSet(viewsets.ModelViewSet):
    queryset = ProcedureStep.objects.all()
    serializer_class = ProcedureStepSerializer
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return ProcedureStep.objects.all()
        return ProcedureStep.objects.filter(procedure__organization=user.organization)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManager()]
        return super().get_permissions()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)

        step = ProcedureStepService.update_step(instance, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Step updated successfully',
            'data': ProcedureStepSerializer(step).data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        ProcedureStepService.delete_step(instance)

        return Response({
            'success': True,
            'message': 'Step deleted successfully'
        }, status=status.HTTP_200_OK)


class ProcedureTemplateViewSet(viewsets.ModelViewSet):
    queryset = ProcedureTemplate.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['organization', 'category', 'is_public']
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['created_at', 'name', 'usage_count']
    ordering = ['-usage_count', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProcedureTemplateListSerializer
        elif self.action == 'create':
            return ProcedureTemplateCreateSerializer
        return ProcedureTemplateSerializer

    def get_queryset(self):
        return ProcedureTemplateService.get_templates_for_user(self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManager()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        template = ProcedureTemplateService.create_template(
            created_by=request.user,
            **serializer.validated_data
        )

        return Response({
            'success': True,
            'message': 'Template created successfully',
            'data': ProcedureTemplateSerializer(template).data
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()

        return Response({
            'success': True,
            'message': 'Template deleted successfully'
        }, status=status.HTTP_200_OK)
