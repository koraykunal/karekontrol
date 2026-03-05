from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from .models import Organization, Department


class OrganizationSerializer(MobileCompatibleSerializer):
    department_count = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    entity_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'company_number', 'registration_number', 'qr_quota',
            'description', 'is_active', 'is_sandbox',
            'contact_email', 'contact_phone', 'address',
            'department_count', 'user_count', 'entity_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_department_count(self, obj):
        return obj.departments.count()

    def get_user_count(self, obj):
        return obj.users.count()

    def get_entity_count(self, obj):
        from apps.entities.models import Entity
        return Entity.objects.filter(organization=obj, is_deleted=False).count()


class OrganizationListSerializer(MobileCompatibleSerializer):
    department_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'company_number', 'qr_quota', 'is_active', 'is_sandbox', 'department_count', 'created_at']

    def get_department_count(self, obj):
        return obj.departments.count()


class OrganizationCreateUpdateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Organization
        fields = [
            'name', 'company_number', 'registration_number', 'qr_quota',
            'description', 'contact_email', 'contact_phone', 'address',
        ]


class OnboardOrganizationSerializer(serializers.Serializer):
    # Organization fields
    name = serializers.CharField(max_length=200)
    company_number = serializers.CharField(max_length=50)
    registration_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    qr_quota = serializers.IntegerField(min_value=0, default=0)

    # Admin user fields
    admin_full_name = serializers.CharField(max_length=200)
    admin_email = serializers.EmailField()
    admin_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    admin_password = serializers.CharField(max_length=128, required=False, allow_blank=True)

    def validate_company_number(self, value):
        if Organization.objects.filter(company_number=value).exists():
            raise serializers.ValidationError('Bu firma numarası zaten kullanılıyor')
        return value

    def validate_name(self, value):
        if Organization.objects.filter(name=value).exists():
            raise serializers.ValidationError('Bu isimde bir organizasyon zaten mevcut')
        return value

    def validate_admin_email(self, value):
        from apps.authentication.models import User
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Bu e-posta adresi zaten kullanılıyor')
        return value


class DepartmentSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True, allow_null=True)
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'organization', 'organization_name',
            'manager', 'manager_name', 'name', 'description', 'code',
            'user_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_count(self, obj):
        return obj.users.count()


class DepartmentListSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True, allow_null=True)

    class Meta:
        model = Department
        fields = ['id', 'organization', 'organization_name', 'name', 'code', 'manager_name']


class DepartmentCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Department
        fields = ['organization', 'name', 'description', 'code']

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if user.role == 'ADMIN' and attrs.get('organization') != user.organization:
                raise serializers.ValidationError({
                    'organization': 'You can only create departments in your own organization'
                })
        return attrs


class DepartmentUpdateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Department
        fields = ['name', 'description', 'code', 'manager']


class DepartmentManagerAssignSerializer(serializers.Serializer):
    manager_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_manager_id(self, value):
        if value is None:
            return value
        
        from apps.authentication.models import User
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('User not found')
        
        department = self.context.get('department')
        if department and user.organization != department.organization:
            raise serializers.ValidationError('Manager must be from the same organization')
        
        return value
