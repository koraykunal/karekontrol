from django.contrib.auth import authenticate
from django.db import transaction
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from apps.core.exceptions import AuthenticationError, ValidationError, NotFoundError, AuthorizationError
from .models import User

# Allowed fields for user update (prevent mass assignment)
ALLOWED_USER_UPDATE_FIELDS = ['full_name', 'phone', 'avatar_url']


class AuthService:
    @staticmethod
    def register_user(email, password, full_name, organization, department=None, role='WORKER', **extra_fields):
        if User.objects.filter(email=email).exists():
            raise ValidationError('User with this email already exists')

        if not organization:
            raise ValidationError('Organization is required for non-SUPER_ADMIN users')

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                full_name=full_name,
                organization=organization,
                department=department,
                role=role,
                **extra_fields
            )

        return user

    @staticmethod
    def authenticate_user(email, password):
        user = authenticate(email=email, password=password)

        if not user:
            raise AuthenticationError('Invalid email or password')

        if not user.is_active:
            raise AuthenticationError('User account is disabled')

        return user

    @staticmethod
    def generate_tokens(user):
        from .serializers import UserSerializer

        refresh = RefreshToken.for_user(user)
        access_token_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']

        return {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'token_type': 'Bearer',
            'expires_in': int(access_token_lifetime.total_seconds()),
            'user': UserSerializer(user).data
        }

    @staticmethod
    def change_password(user, old_password, new_password):
        if not user.check_password(old_password):
            raise ValidationError('Old password is incorrect')

        user.set_password(new_password)
        user.save(update_fields=['password'])

        # Invalidate all existing tokens for this user
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        tokens = OutstandingToken.objects.filter(user=user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        return user

    @staticmethod
    def get_user_by_id(user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFoundError('User not found')

    @staticmethod
    def get_user_by_email(email):
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            raise NotFoundError('User not found')

    @staticmethod
    def update_user(user, **data):
        # Only allow updating specific fields to prevent mass assignment
        for field, value in data.items():
            if field not in ALLOWED_USER_UPDATE_FIELDS:
                continue  # Skip disallowed fields
            if hasattr(user, field):
                setattr(user, field, value)

        user.save()
        return user

    @staticmethod
    def activate_user(user):
        user.is_active = True
        user.save(update_fields=['is_active'])

        from apps.permissions.engine import PermissionEngine
        PermissionEngine.invalidate_cache(user)

        return user

    @staticmethod
    def deactivate_user(user):
        user.is_active = False
        user.save(update_fields=['is_active'])

        from apps.permissions.engine import PermissionEngine
        PermissionEngine.invalidate_cache(user)

        return user

    @staticmethod
    def update_user_role(user, new_role, by_user):
        if new_role == 'SUPER_ADMIN' and by_user.role != 'SUPER_ADMIN':
            raise AuthorizationError('Only SUPER_ADMIN can assign SUPER_ADMIN role')

        if by_user.role == 'ADMIN' and user.organization != by_user.organization:
            raise AuthorizationError('You can only update users in your organization')

        user.role = new_role
        user.save(update_fields=['role'])

        from apps.permissions.engine import PermissionEngine
        PermissionEngine.invalidate_cache(user)

        return user

    @staticmethod
    def verify_organization_access(user, organization):
        if user.role == 'SUPER_ADMIN':
            return True

        if user.organization != organization:
            raise AuthorizationError('You do not have access to this organization')

        return True

    @staticmethod
    def verify_department_access(user, department):
        if user.role == 'SUPER_ADMIN':
            return True

        if user.role == 'ADMIN' and user.organization == department.organization:
            return True

        if user.department == department:
            return True

        raise AuthorizationError('You do not have access to this department')
