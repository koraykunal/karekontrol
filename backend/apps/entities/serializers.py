from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from .models import Entity, EntityImage, EntityDocument, EntityShare


class EntityImageSerializer(MobileCompatibleSerializer):
    class Meta:
        model = EntityImage
        fields = [
            'id', 'entity', 'image', 'thumbnail', 'caption',
            'is_primary', 'order', 'created_at'
        ]
        read_only_fields = ['id', 'thumbnail', 'created_at']


class EntityImageUploadSerializer(MobileCompatibleSerializer):
    class Meta:
        model = EntityImage
        fields = ['image', 'caption', 'is_primary', 'order']


class EntityDocumentSerializer(MobileCompatibleSerializer):
    class Meta:
        model = EntityDocument
        fields = [
            'id', 'entity', 'file', 'title', 'document_type',
            'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class EntityDocumentUploadSerializer(MobileCompatibleSerializer):
    class Meta:
        model = EntityDocument
        fields = ['file', 'title', 'document_type', 'description']


class EntitySerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    images = EntityImageSerializer(many=True, read_only=True)
    documents = EntityDocumentSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    procedure_count = serializers.SerializerMethodField()
    procedures = serializers.SerializerMethodField()

    class Meta:
        model = Entity
        fields = [
            'id', 'organization', 'organization_name',
            'department', 'department_name',
            'entity_type', 'name', 'code', 'qr_code', 'qr_image',
            'description', 'custom_fields', 'status', 'location',
            'serial_number', 'manufacturer', 'model',
            'purchase_date', 'warranty_expiry_date', 'notes',
            'images', 'documents', 'primary_image', 'procedure_count', 'procedures',
            'is_deleted', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'qr_code', 'qr_image', 'is_deleted', 'created_at', 'updated_at']

    def get_primary_image(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'images' in obj._prefetched_objects_cache:
            images = obj._prefetched_objects_cache['images']
            for img in images:
                if img.is_primary:
                    return EntityImageSerializer(img, context=self.context).data
            if images:
                return EntityImageSerializer(images[0], context=self.context).data
            return None

        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return EntityImageSerializer(primary, context=self.context).data
        first = obj.images.first()
        if first:
            return EntityImageSerializer(first, context=self.context).data
        return None

    def get_procedure_count(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'procedures' in obj._prefetched_objects_cache:
            return len([p for p in obj._prefetched_objects_cache['procedures'] if not p.is_deleted and p.is_active])
        return obj.procedures.filter(is_deleted=False, is_active=True).count()

    def get_procedures(self, obj):
        from apps.procedures.serializers import ProcedureListSerializer

        if hasattr(obj, '_prefetched_objects_cache') and 'procedures' in obj._prefetched_objects_cache:
            procedures = [p for p in obj._prefetched_objects_cache['procedures'] if not p.is_deleted]
        else:
            procedures = obj.procedures.filter(is_deleted=False)

            request = self.context.get('request')
            if request and hasattr(request, 'user'):
                user = request.user
                if user.role == 'SUPER_ADMIN':
                    pass
                else:
                    procedures = procedures.filter(organization=user.organization)

        return ProcedureListSerializer(procedures, many=True).data


class EntityListSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    primary_image_url = serializers.SerializerMethodField()
    open_issue_count = serializers.SerializerMethodField()

    class Meta:
        model = Entity
        fields = [
            'id', 'organization', 'organization_name',
            'department', 'department_name',
            'entity_type', 'name', 'code', 'qr_code',
            'status', 'location', 'primary_image_url', 'open_issue_count', 'created_at'
        ]

    def get_primary_image_url(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'images' in obj._prefetched_objects_cache:
            images = list(obj._prefetched_objects_cache['images'])
            img = images[0] if images else None
        else:
            img = obj.images.filter(is_primary=True).first() or obj.images.first()

        if not img:
            return None
        url = img.thumbnail.url if img.thumbnail else None
        if url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
        return url

    def get_open_issue_count(self, obj):
        if hasattr(obj, 'open_issue_count'):
            return obj.open_issue_count

        from apps.compliance.models import NonComplianceIssue
        from apps.core.constants import IssueStatus

        return NonComplianceIssue.objects.filter(
            entity=obj
        ).exclude(
            status__in=[IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED]
        ).count()


class EntityCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Entity
        fields = [
            'organization', 'department', 'entity_type', 'name', 'code',
            'description', 'custom_fields', 'status', 'location',
            'serial_number', 'manufacturer', 'model',
            'purchase_date', 'warranty_expiry_date', 'notes'
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if user.role != 'SUPER_ADMIN' and attrs.get('organization') != user.organization:
                raise serializers.ValidationError({
                    'organization': 'Bu organizasyona kaynak oluşturamazsınız'
                })
            if user.role == 'MANAGER' and attrs.get('department') != user.department:
                raise serializers.ValidationError({
                    'department': 'You can only create entities in your own department'
                })
        return attrs


class EntityUpdateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Entity
        fields = [
            'entity_type', 'name', 'code', 'description', 'custom_fields',
            'status', 'location', 'serial_number', 'manufacturer', 'model',
            'purchase_date', 'warranty_expiry_date', 'notes'
        ]


class EntityShareSerializer(MobileCompatibleSerializer):
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    department_name = serializers.CharField(source='shared_with_department.name', read_only=True)
    shared_by_name = serializers.CharField(source='shared_by_user.full_name', read_only=True, allow_null=True)

    class Meta:
        model = EntityShare
        fields = [
            'id', 'entity', 'entity_name',
            'shared_with_department', 'department_name',
            'shared_by_user', 'shared_by_name',
            'reason', 'is_active', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'shared_by_user', 'created_at']


class EntityShareCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = EntityShare
        fields = ['shared_with_department', 'reason', 'expires_at']

    def validate_shared_with_department(self, value):
        entity = self.context.get('entity')
        if entity and value.organization != entity.organization:
            raise serializers.ValidationError('Cannot share with departments outside the organization')
        if entity and value == entity.department:
            raise serializers.ValidationError('Entity is already in this department')
        return value


class EntityQRScanSerializer(serializers.Serializer):
    qr_code = serializers.CharField(max_length=255)
