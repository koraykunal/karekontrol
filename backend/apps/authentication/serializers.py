from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User
from apps.core.constants import UserRole
from apps.core.serializers import MobileCompatibleSerializer


from apps.permissions.engine import PermissionEngine

class UserSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    is_super_admin = serializers.BooleanField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    is_manager = serializers.BooleanField(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'avatar_url',
            'organization', 'organization_name',
            'department', 'department_name',
            'role', 'is_active', 'is_super_admin', 'is_admin', 'is_manager',
            'permissions',
            'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']

    def get_permissions(self, obj):
        return PermissionEngine.get_user_permissions(obj)


class UserListSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'is_active',
            'organization', 'organization_name',
            'department', 'department_name'
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'full_name', 'phone']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match"})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        validated_data['role'] = UserRole.WORKER
        validated_data['organization'] = None
        validated_data['department'] = None

        user = User.objects.create_user(password=password, **validated_data)
        return user


class _OrganizationRelatedField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        from apps.organizations.models import Organization
        return Organization.objects.all()


class _DepartmentRelatedField(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        from apps.organizations.models import Department
        return Department.objects.all()


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    organization = _OrganizationRelatedField(required=True)
    department = _DepartmentRelatedField(required=False, allow_null=True)
    role = serializers.ChoiceField(choices=UserRole.choices, required=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone', 'password', 'password_confirm',
                  'organization', 'department', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match"})

        request_user = self.context.get('request') and self.context['request'].user
        if request_user:
            if request_user.role == UserRole.ADMIN:
                if attrs['organization'] != request_user.organization:
                    raise serializers.ValidationError({
                        'organization': 'You can only create users in your own organization'
                    })
                if attrs['role'] == UserRole.SUPER_ADMIN:
                    raise serializers.ValidationError({
                        'role': 'You cannot assign SUPER_ADMIN role'
                    })
            if attrs['role'] == UserRole.SUPER_ADMIN and request_user.role != UserRole.SUPER_ADMIN:
                raise serializers.ValidationError({
                    'role': 'Only SUPER_ADMIN can assign SUPER_ADMIN role'
                })

        # Validate department belongs to organization
        dept = attrs.get('department')
        if dept and dept.organization != attrs['organization']:
            raise serializers.ValidationError({
                'department': 'Department must belong to the selected organization'
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(email=email, password=password)

            if not user:
                raise serializers.ValidationError('Invalid email or password')

            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Email and password are required')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Passwords do not match"})

        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'phone', 'avatar_url']

    def validate_avatar_url(self, value):
        if value and not value.startswith('https://'):
            raise serializers.ValidationError('Avatar URL must use HTTPS.')
        return value


class UserRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['role']

    def validate_role(self, value):
        request_user = self.context['request'].user

        if value == UserRole.SUPER_ADMIN and request_user.role != UserRole.SUPER_ADMIN:
            raise serializers.ValidationError("Only SUPER_ADMIN can assign SUPER_ADMIN role")

        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        access_token_lifetime = api_settings.ACCESS_TOKEN_LIFETIME
        refresh_token = data.pop('refresh')
        access_token = data.pop('access')

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': int(access_token_lifetime.total_seconds()),
            'user': UserSerializer(self.user).data
        }


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        access_token_lifetime = api_settings.ACCESS_TOKEN_LIFETIME
        access_token = data.pop('access')

        result = {
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': int(access_token_lifetime.total_seconds())
        }

        if 'refresh' in data:
            result['refresh_token'] = data['refresh']

        return result
