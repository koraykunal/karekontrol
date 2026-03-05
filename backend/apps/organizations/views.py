from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.core.permissions import IsAuthenticatedAndActive, IsSuperAdmin, IsAdmin
from apps.core.pagination import StandardResultsSetPagination
from .models import Organization, Department
from .serializers import (
    OrganizationSerializer, OrganizationListSerializer, OrganizationCreateUpdateSerializer,
    OnboardOrganizationSerializer,
    DepartmentSerializer, DepartmentListSerializer, DepartmentCreateSerializer,
    DepartmentUpdateSerializer, DepartmentManagerAssignSerializer
)
from .services import OrganizationService, DepartmentService


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_sandbox']
    search_fields = ['name', 'company_number', 'description', 'contact_email']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return OrganizationListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OrganizationCreateUpdateSerializer
        return OrganizationSerializer

    def get_queryset(self):
        return OrganizationService.get_all_organizations(self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'reset']:
            return [IsSuperAdmin()]
        if self.action in ['update', 'partial_update', 'activate', 'deactivate']:
            return [IsAdmin()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        organization = OrganizationService.create_organization(**serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Organization created successfully',
            'data': OrganizationSerializer(organization).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)

        organization = OrganizationService.update_organization(instance, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Organization updated successfully',
            'data': OrganizationSerializer(organization).data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        OrganizationService.deactivate_organization(instance)

        return Response({
            'success': True,
            'message': 'Organization deactivated successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='activate', permission_classes=[IsSuperAdmin])
    def activate(self, request, pk=None):
        organization = self.get_object()
        OrganizationService.activate_organization(organization)

        return Response({
            'success': True,
            'message': 'Organization activated successfully',
            'data': OrganizationSerializer(organization).data
        })

    @action(detail=True, methods=['post'], url_path='deactivate', permission_classes=[IsSuperAdmin])
    def deactivate(self, request, pk=None):
        organization = self.get_object()
        OrganizationService.deactivate_organization(organization)

        return Response({
            'success': True,
            'message': 'Organization deactivated successfully',
            'data': OrganizationSerializer(organization).data
        })

    @action(detail=False, methods=['post'], url_path='onboard', permission_classes=[IsSuperAdmin])
    def onboard(self, request):
        serializer = OnboardOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        org_data = {
            'name': data['name'],
            'company_number': data['company_number'],
            'registration_number': data.get('registration_number'),
            'qr_quota': data.get('qr_quota', 0),
            'description': data.get('description'),
            'contact_email': data.get('contact_email'),
            'contact_phone': data.get('contact_phone'),
            'address': data.get('address'),
        }
        admin_data = {
            'admin_full_name': data['admin_full_name'],
            'admin_email': data['admin_email'],
            'admin_phone': data.get('admin_phone'),
            'admin_password': data.get('admin_password'),
        }

        organization, admin_user, plain_password = OrganizationService.onboard_organization(org_data, admin_data)

        from apps.authentication.serializers import UserSerializer
        return Response({
            'success': True,
            'message': 'Organization onboarded successfully',
            'data': {
                'organization': OrganizationSerializer(organization).data,
                'admin_user': UserSerializer(admin_user).data,
                'admin_password': plain_password,
            }
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='quota')
    def quota(self, request, pk=None):
        organization = self.get_object()
        from apps.entities.services import EntityService
        current_count, qr_quota = EntityService.check_quota(organization)

        return Response({
            'success': True,
            'data': {
                'qr_quota': qr_quota,
                'entity_count': current_count,
                'remaining': max(0, qr_quota - current_count) if qr_quota > 0 else None,
                'is_unlimited': qr_quota == 0,
            }
        })

    @action(detail=True, methods=['get'], url_path='departments')
    def departments(self, request, pk=None):
        organization = self.get_object()
        departments = Department.objects.filter(organization=organization).select_related('organization', 'manager')
        page = self.paginate_queryset(departments)

        if page is not None:
            serializer = DepartmentListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = DepartmentListSerializer(departments, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


    @action(detail=True, methods=['post'], url_path='reset', permission_classes=[IsSuperAdmin])
    def reset(self, request, pk=None):
        import os
        organization = self.get_object()

        if not organization.is_sandbox:
            return Response({
                'success': False,
                'message': 'Sadece sandbox organizasyonlar sıfırlanabilir',
            }, status=status.HTTP_400_BAD_REQUEST)

        password = request.data.get('password') or os.environ.get('DEMO_PASSWORD')
        if not password:
            return Response({
                'success': False,
                'message': 'password parametresi gerekli',
            }, status=status.HTTP_400_BAD_REQUEST)

        result = OrganizationService.reset_sandbox_organization(organization.id, password)

        return Response({
            'success': True,
            'message': 'Sandbox organizasyon sıfırlandı ve demo veri ile yeniden oluşturuldu',
            'data': result,
        })


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['organization']
    search_fields = ['name', 'description', 'code']
    ordering_fields = ['created_at', 'name']
    ordering = ['organization', 'name']

    def get_serializer_class(self):
        if self.action == 'list':
            return DepartmentListSerializer
        elif self.action == 'create':
            return DepartmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DepartmentUpdateSerializer
        elif self.action == 'assign_manager':
            return DepartmentManagerAssignSerializer
        return DepartmentSerializer

    def get_queryset(self):
        return DepartmentService.get_departments_for_user(self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdmin()]
        if self.action in ['update', 'partial_update', 'assign_manager']:
            return [IsAdmin()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        department = DepartmentService.create_department(**serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Department created successfully',
            'data': DepartmentSerializer(department).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)

        department = DepartmentService.update_department(instance, **serializer.validated_data)

        return Response({
            'success': True,
            'message': 'Department updated successfully',
            'data': DepartmentSerializer(department).data
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        DepartmentService.delete_department(instance)

        return Response({
            'success': True,
            'message': 'Department deleted successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='assign-manager', permission_classes=[IsAdmin])
    def assign_manager(self, request, pk=None):
        department = self.get_object()
        serializer = DepartmentManagerAssignSerializer(
            data=request.data,
            context={'department': department}
        )
        serializer.is_valid(raise_exception=True)

        manager_id = serializer.validated_data.get('manager_id')
        manager = None
        if manager_id:
            from apps.authentication.models import User
            manager = User.objects.get(id=manager_id)

        DepartmentService.assign_manager(department, manager)

        return Response({
            'success': True,
            'message': 'Manager assigned successfully',
            'data': DepartmentSerializer(department).data
        })

    @action(detail=True, methods=['get'], url_path='users')
    def users(self, request, pk=None):
        department = self.get_object()
        users = department.users.filter(is_active=True)

        from apps.authentication.serializers import UserListSerializer
        page = self.paginate_queryset(users)

        if page is not None:
            serializer = UserListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = UserListSerializer(users, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })
