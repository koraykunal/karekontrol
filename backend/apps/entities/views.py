from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Prefetch, Count, Q, OuterRef, Subquery, IntegerField, Value
from django.db.models.functions import Coalesce

from apps.core.permissions import IsAuthenticatedAndActive, IsAdmin, IsManager
from apps.core.pagination import StandardResultsSetPagination
from apps.permissions.permissions import (
    CanViewEntities, CanCreateEntities, CanEditEntities, CanDeleteEntities
)
from apps.permissions.engine import PermissionEngine
from apps.permissions.enums import PermissionKey
from .models import Entity, EntityImage, EntityDocument, EntityShare
from .serializers import (
    EntitySerializer, EntityListSerializer, EntityCreateSerializer, EntityUpdateSerializer,
    EntityImageSerializer, EntityImageUploadSerializer,
    EntityDocumentSerializer, EntityDocumentUploadSerializer,
    EntityShareSerializer, EntityShareCreateSerializer, EntityQRScanSerializer
)
from .services import EntityService, EntityImageService, EntityDocumentService, EntityShareService


class EntityViewSet(viewsets.ModelViewSet):
    queryset = Entity.objects.filter(is_deleted=False)
    permission_classes = [IsAuthenticatedAndActive, CanViewEntities]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['organization', 'department', 'entity_type', 'status']
    search_fields = ['name', 'code', 'qr_code', 'description', 'serial_number', 'manufacturer', 'model']
    ordering_fields = ['created_at', 'name', 'code', 'entity_type']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EntityListSerializer
        elif self.action == 'create':
            return EntityCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return EntityUpdateSerializer
        elif self.action == 'scan_qr':
            return EntityQRScanSerializer
        return EntitySerializer

    def get_queryset(self):
        queryset = EntityService.get_entities_for_user(self.request.user)

        # Optimize queries with select_related and prefetch_related
        queryset = queryset.select_related('organization', 'department')

        if self.action == 'list':
            from apps.core.constants import IssueStatus
            from apps.compliance.models import NonComplianceIssue

            open_issue_subq = (
                NonComplianceIssue.objects
                .filter(entity=OuterRef('pk'))
                .exclude(status__in=[IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED])
                .values('entity')
                .annotate(c=Count('pk'))
                .values('c')
            )

            queryset = queryset.prefetch_related(
                Prefetch('images', queryset=EntityImage.objects.filter(is_primary=True))
            ).annotate(
                open_issue_count=Coalesce(
                    Subquery(open_issue_subq, output_field=IntegerField()),
                    Value(0),
                )
            )
        elif self.action == 'retrieve':
            # For detail view, prefetch all related data
            queryset = queryset.prefetch_related('images', 'documents', 'procedures')

        return queryset

    def get_permissions(self):
        permission_map = {
            'create': [IsAuthenticatedAndActive(), CanCreateEntities()],
            'update': [IsAuthenticatedAndActive(), CanEditEntities()],
            'partial_update': [IsAuthenticatedAndActive(), CanEditEntities()],
            'destroy': [IsAuthenticatedAndActive(), CanDeleteEntities()],
        }
        return permission_map.get(self.action, super().get_permissions())

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        entity = EntityService.create_entity(**serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Entity created successfully',
            'data': EntitySerializer(entity).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)

        entity = EntityService.update_entity(instance, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Entity updated successfully',
            'data': EntitySerializer(entity).data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        EntityService.soft_delete_entity(instance)

        return Response({
            'success': True,
            'message': 'Entity deleted successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='restore', permission_classes=[IsAuthenticatedAndActive, CanDeleteEntities])
    def restore(self, request, pk=None):
        queryset = Entity.objects.filter(id=pk)
        queryset = PermissionEngine.filter_queryset(queryset, request.user, PermissionKey.DELETE_ENTITIES)

        entity = queryset.first()
        if not entity:
            return Response({
                'success': False,
                'message': 'Entity not found'
            }, status=status.HTTP_404_NOT_FOUND)

        EntityService.restore_entity(entity)

        return Response({
            'success': True,
            'message': 'Entity restored successfully',
            'data': EntitySerializer(entity).data
        })

    @action(detail=False, methods=['post'], url_path='scan-qr')
    def scan_qr(self, request):
        serializer = EntityQRScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        entity = EntityService.get_entity_by_qr_code(
            serializer.validated_data['qr_code'],
            request.user
        )

        return Response({
            'success': True,
            'data': EntitySerializer(entity).data
        })

    @action(detail=False, methods=['get'], url_path='scan/(?P<qr_code>[^/.]+)')
    def scan(self, request, qr_code=None):
        entity = EntityService.get_entity_by_qr_code(qr_code, request.user)

        return Response({
            'success': True,
            'data': EntitySerializer(entity).data
        })

    @action(detail=True, methods=['post'], url_path='upload-image',
            parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticatedAndActive, CanEditEntities])
    def upload_image(self, request, pk=None):
        entity = self.get_object()
        serializer = EntityImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        image = EntityImageService.add_image(entity, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Image uploaded successfully',
            'data': EntityImageSerializer(image).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='images')
    def images(self, request, pk=None):
        entity = self.get_object()
        images = entity.images.all()
        serializer = EntityImageSerializer(images, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='upload-document',
            parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticatedAndActive, CanEditEntities])
    def upload_document(self, request, pk=None):
        entity = self.get_object()
        serializer = EntityDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        document = EntityDocumentService.add_document(entity, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Document uploaded successfully',
            'data': EntityDocumentSerializer(document).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='documents')
    def documents(self, request, pk=None):
        entity = self.get_object()
        documents = entity.documents.all()
        serializer = EntityDocumentSerializer(documents, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='share', permission_classes=[IsAuthenticatedAndActive, CanEditEntities])
    def share(self, request, pk=None):
        entity = self.get_object()
        serializer = EntityShareCreateSerializer(data=request.data, context={'entity': entity})
        serializer.is_valid(raise_exception=True)

        share = EntityShareService.share_entity(
            entity=entity,
            shared_with_department=serializer.validated_data['shared_with_department'],
            shared_by_user=request.user,
            reason=serializer.validated_data.get('reason'),
            expires_at=serializer.validated_data.get('expires_at')
        )

        return Response({
            'success': True,
            'message': 'Entity shared successfully',
            'data': EntityShareSerializer(share).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='shares')
    def shares(self, request, pk=None):
        entity = self.get_object()
        shares = entity.shares.filter(is_active=True)
        serializer = EntityShareSerializer(shares, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        entity = self.get_object()
        from apps.core.constants import ProcedureLogStatus
        logs = entity.procedure_logs.filter(status=ProcedureLogStatus.COMPLETED).order_by('-completed_at')
        
        # We need to import locally to avoid circular import
        from apps.execution.serializers import ProcedureLogListSerializer
        
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = ProcedureLogListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = ProcedureLogListSerializer(logs, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class EntityImageViewSet(viewsets.ModelViewSet):
    queryset = EntityImage.objects.all()
    serializer_class = EntityImageSerializer
    permission_classes = [IsAuthenticatedAndActive]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = EntityImage.objects.all()
        queryset = queryset.filter(
            entity__in=PermissionEngine.filter_queryset(Entity.objects.all(), self.request.user, PermissionKey.VIEW_ENTITIES)
        )
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        EntityImageService.delete_image(instance)

        return Response({
            'success': True,
            'message': 'Image deleted successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='set-primary')
    def set_primary(self, request, pk=None):
        entity_image = self.get_object()
        EntityImageService.set_primary_image(entity_image)

        return Response({
            'success': True,
            'message': 'Image set as primary',
            'data': EntityImageSerializer(entity_image).data
        })


class EntityDocumentViewSet(viewsets.ModelViewSet):
    queryset = EntityDocument.objects.all()
    serializer_class = EntityDocumentSerializer
    permission_classes = [IsAuthenticatedAndActive]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = EntityDocument.objects.all()
        queryset = queryset.filter(
            entity__in=PermissionEngine.filter_queryset(Entity.objects.all(), self.request.user, PermissionKey.VIEW_ENTITIES)
        )
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        EntityDocumentService.delete_document(instance)

        return Response({
            'success': True,
            'message': 'Document deleted successfully'
        }, status=status.HTTP_200_OK)


class EntityShareViewSet(viewsets.ModelViewSet):
    queryset = EntityShare.objects.filter(is_active=True)
    serializer_class = EntityShareSerializer
    permission_classes = [IsAuthenticatedAndActive]

    def get_queryset(self):
        queryset = EntityShare.objects.filter(is_active=True)
        queryset = queryset.filter(
            entity__in=PermissionEngine.filter_queryset(Entity.objects.all(), self.request.user, PermissionKey.VIEW_ENTITIES)
        )
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        EntityShareService.unshare_entity(instance)

        return Response({
            'success': True,
            'message': 'Share removed successfully'
        }, status=status.HTTP_200_OK)
