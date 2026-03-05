from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import IsAuthenticatedAndActive, IsAdmin, IsManager
from apps.core.pagination import StandardResultsSetPagination
from apps.core.constants import UserRole
from .models import ProcedureAssignment, PermissionPolicy
from .serializers import (
    ProcedureAssignmentSerializer, ProcedureAssignmentCreateSerializer,
    PermissionPolicySerializer
)
from .permissions import CanAccessManagement, CanConfigurePermissions
from .enums import PermissionKey, PermissionScope
from .engine import PermissionEngine


class ProcedureAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProcedureAssignment.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['assigned_to_user', 'procedure', 'status']

    def get_serializer_class(self):
        if self.action == 'create':
            return ProcedureAssignmentCreateSerializer
        return ProcedureAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = ProcedureAssignment.objects.all()
        queryset = PermissionEngine.filter_queryset(queryset, user, PermissionKey.ASSIGN_PROCEDURES)
        return queryset


class PermissionPolicyViewSet(viewsets.ModelViewSet):
    queryset = PermissionPolicy.objects.all()
    permission_classes = [IsAuthenticatedAndActive, CanAccessManagement]
    serializer_class = PermissionPolicySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['organization', 'department', 'role', 'is_active']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            org_id = self.request.query_params.get('organization_id')
            if org_id:
                return PermissionPolicy.objects.filter(organization_id=org_id, is_active=True)
            return PermissionPolicy.objects.filter(is_active=True)
        queryset = PermissionPolicy.objects.filter(
            organization=user.organization,
            is_active=True
        )
        if user.department_id and user.role == UserRole.MANAGER:
            queryset = queryset.filter(
                Q(department__isnull=True) | Q(department=user.department)
            )
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(
            organization=self.request.user.organization,
            configured_by=self.request.user
        )
        self._invalidate_affected_users(instance)

    def perform_update(self, serializer):
        instance = serializer.save(configured_by=self.request.user)
        self._invalidate_affected_users(instance)

    def perform_destroy(self, instance):
        self._invalidate_affected_users(instance)
        instance.delete()

    @action(detail=False, methods=['post'], url_path='save', permission_classes=[IsAuthenticatedAndActive, CanConfigurePermissions])
    def save_policy(self, request):
        role = request.data.get('role')
        permissions = request.data.get('permissions', {})
        department_id = request.data.get('department_id')

        if not role:
            return Response({'error': 'Role is required'}, status=status.HTTP_400_BAD_REQUEST)

        valid_keys = set(PermissionKey.values)
        for key in permissions.keys():
            if key not in valid_keys:
                return Response(
                    {'error': f'Invalid permission key: {key}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        organization = request.user.organization
        department = None

        if department_id:
            from apps.organizations.models import Department
            try:
                department = Department.objects.get(id=department_id, organization=organization)
            except Department.DoesNotExist:
                return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)

        policy, created = PermissionPolicy.objects.update_or_create(
            organization=organization,
            department=department,
            role=role,
            defaults={
                'permissions': permissions,
                'configured_by': request.user,
                'is_active': True
            }
        )

        self._invalidate_affected_users(policy)

        return Response({
            'success': True,
            'message': 'Policy saved successfully',
            'data': self.get_serializer(policy).data
        })

    @action(detail=False, methods=['get'], url_path='schema')
    def permission_schema(self, request):
        return Response({
            'permissions': [
                {'key': key, 'label': label}
                for key, label in PermissionKey.choices
            ],
            'scopes': [
                {'key': key, 'label': label}
                for key, label in PermissionScope.choices
            ],
            'roles': [
                {'key': key, 'label': label}
                for key, label in UserRole.choices
            ]
        })

    @action(detail=False, methods=['get'], url_path='defaults')
    def role_defaults(self, request):
        role = request.query_params.get('role')
        if not role:
            return Response({'error': 'Role parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        organization = request.user.organization
        department_id = request.query_params.get('department_id')

        policy = None
        if department_id:
            from apps.organizations.models import Department
            try:
                department = Department.objects.get(id=department_id, organization=organization)
                policy = PermissionPolicy.objects.filter(
                    organization=organization,
                    department=department,
                    role=role,
                    is_active=True
                ).first()
            except Department.DoesNotExist:
                pass

        if not policy:
            policy = PermissionPolicy.objects.filter(
                organization=organization,
                department__isnull=True,
                role=role,
                is_active=True
            ).first()

        if policy:
            permissions = policy.permissions
        else:
            permissions = PermissionEngine._get_role_defaults(role)

        return Response({'role': role, 'permissions': permissions})

    def _invalidate_affected_users(self, policy):
        from apps.authentication.models import User
        filters = {'organization': policy.organization, 'role': policy.role}
        if policy.department:
            filters['department'] = policy.department

        affected_users = User.objects.filter(**filters)
        for user in affected_users:
            PermissionEngine.invalidate_cache(user)
