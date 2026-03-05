from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.core.permissions import IsAuthenticatedAndActive, IsSuperAdmin, IsAdmin, CanUpdateUser, CanDeleteUser
from apps.core.pagination import StandardResultsSetPagination
from .models import User
from .serializers import (
    UserSerializer, UserListSerializer, RegisterSerializer,
    AdminCreateUserSerializer,
    LoginSerializer, ChangePasswordSerializer,
    UserUpdateSerializer, UserRoleUpdateSerializer,
    CustomTokenObtainPairSerializer, CustomTokenRefreshSerializer
)
from .services import AuthService


class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'


class RegisterRateThrottle(AnonRateThrottle):
    rate = '3/hour'


class AuthViewSet(viewsets.GenericViewSet):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='register', throttle_classes=[RegisterRateThrottle])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        tokens = AuthService.generate_tokens(user)

        # Wrap response for mobile compatibility
        return Response({
            'success': True,
            'message': 'Registration successful',
            'data': tokens
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='login', throttle_classes=[LoginRateThrottle])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        tokens = AuthService.generate_tokens(user)

        # Wrap response for mobile compatibility
        return Response({
            'success': True,
            'message': 'Login successful',
            'data': tokens
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticatedAndActive])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data
        })

    @action(detail=False, methods=['post'], url_path='change-password', permission_classes=[IsAuthenticatedAndActive], throttle_classes=[LoginRateThrottle])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        AuthService.change_password(
            request.user,
            serializer.validated_data['old_password'],
            serializer.validated_data['new_password']
        )

        return Response({
            'success': True,
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='logout', permission_classes=[IsAuthenticatedAndActive])
    def logout(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response({
                    'success': False,
                    'message': 'refresh_token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                'success': True,
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response({
                'success': False,
                'message': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'organization', 'department']
    search_fields = ['email', 'full_name', 'phone']
    ordering_fields = ['created_at', 'email', 'full_name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticatedAndActive(), CanUpdateUser()]
        elif self.action == 'destroy':
            return [IsAuthenticatedAndActive(), CanDeleteUser()]
        elif self.action == 'create':
            return [IsAuthenticatedAndActive(), IsAdmin()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'create':
            return AdminCreateUserSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset().select_related('organization', 'department')

        if user.role == 'SUPER_ADMIN':
            return queryset

        if user.role == 'ADMIN':
            return queryset.filter(organization=user.organization)

        if user.role == 'MANAGER':
            return queryset.filter(department=user.department)

        return queryset.filter(id=user.id)

    def create(self, request, *args, **kwargs):
        serializer = AdminCreateUserSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return Response({
            'success': True,
            'message': 'User created successfully',
            'data': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        AuthService.deactivate_user(instance)

        return Response({
            'success': True,
            'message': 'User deactivated successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='activate', permission_classes=[IsAdmin])
    def activate(self, request, pk=None):
        user = self.get_object()
        AuthService.activate_user(user)

        return Response({
            'success': True,
            'message': 'User activated successfully',
            'data': UserSerializer(user).data
        })

    @action(detail=True, methods=['put'], url_path='role', permission_classes=[IsAdmin])
    def update_role(self, request, pk=None):
        user = self.get_object()
        serializer = UserRoleUpdateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        AuthService.update_user_role(user, serializer.validated_data['role'], request.user)

        return Response({
            'success': True,
            'message': 'User role updated successfully',
            'data': UserSerializer(user).data
        })

    @action(detail=False, methods=['get'], url_path='department/(?P<department_id>[^/.]+)')
    def by_department(self, request, department_id=None):
        users = self.get_queryset().filter(department_id=department_id)
        page = self.paginate_queryset(users)

        if page is not None:
            serializer = UserListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = UserListSerializer(users, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        })


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    throttle_classes = [LoginRateThrottle]
    serializer_class = CustomTokenRefreshSerializer
