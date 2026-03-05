from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from apps.core.constants import ProcedureLogStatus
from .models import Procedure, ProcedureStep, ProcedureTemplate


class ProcedureStepSerializer(MobileCompatibleSerializer):
    is_required = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProcedureStep
        fields = [
            'id', 'procedure', 'step_order', 'title', 'description',
            'requires_photo', 'requires_notes', 'requires_compliance_check',
            'expected_duration_minutes', 'reference_images', 'checklist_items',
            'is_required', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProcedureStepCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = ProcedureStep
        fields = [
            'step_order', 'title', 'description',
            'requires_photo', 'requires_notes', 'requires_compliance_check',
            'expected_duration_minutes', 'reference_images', 'checklist_items'
        ]


class ProcedureSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)
    steps = ProcedureStepSerializer(many=True, read_only=True)
    total_steps = serializers.IntegerField(read_only=True)
    estimated_duration_formatted = serializers.CharField(read_only=True)

    class Meta:
        model = Procedure
        fields = [
            'id', 'organization', 'organization_name',
            'entity', 'entity_name',
            'title', 'description', 'priority',
            'interval_value', 'interval_unit',
            'estimated_duration_minutes', 'estimated_duration_formatted',
            'is_active', 'requires_approval', 'tags',
            'created_by', 'created_by_name',
            'steps', 'total_steps',
            'is_deleted', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_deleted', 'created_at', 'updated_at']


class ProcedureListSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    total_steps = serializers.IntegerField(read_only=True)
    estimated_duration_formatted = serializers.CharField(read_only=True)
    last_completed_at = serializers.SerializerMethodField()
    next_due_date = serializers.SerializerMethodField()
    open_issue_count = serializers.SerializerMethodField()

    class Meta:
        model = Procedure
        fields = [
            'id', 'organization', 'organization_name',
            'entity', 'entity_name',
            'title', 'description', 'priority', 'is_active',
            'interval_value', 'interval_unit',
            'total_steps', 'estimated_duration_formatted',
            'tags', 'created_at',
            'last_completed_at', 'next_due_date', 'open_issue_count'
        ]

    def get_last_completed_at(self, obj):
        if hasattr(obj, 'completed_logs'):
            return obj.completed_logs[0].completed_at if obj.completed_logs else None

        last_log = obj.logs.filter(status=ProcedureLogStatus.COMPLETED).order_by('-completed_at').first()
        return last_log.completed_at if last_log else None

    def get_next_due_date(self, obj):
        if hasattr(obj, 'completed_logs'):
            return obj.completed_logs[0].next_procedure_date if obj.completed_logs else None

        last_log = obj.logs.filter(status=ProcedureLogStatus.COMPLETED).order_by('-completed_at').first()
        return last_log.next_procedure_date if last_log else None

    def get_open_issue_count(self, obj):
        if hasattr(obj, 'open_issue_count'):
            return obj.open_issue_count

        from apps.compliance.models import NonComplianceIssue
        from apps.core.constants import IssueStatus

        return NonComplianceIssue.objects.filter(
            step_log__procedure_log__procedure=obj
        ).exclude(
            status__in=[IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED]
        ).count()


class ProcedureCreateSerializer(MobileCompatibleSerializer):
    steps = ProcedureStepCreateSerializer(many=True, required=False)

    class Meta:
        model = Procedure
        fields = [
            'organization', 'entity', 'title', 'description', 'priority',
            'interval_value', 'interval_unit', 'estimated_duration_minutes',
            'requires_approval', 'tags', 'steps'
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            entity = attrs.get('entity')
            if entity:
                if user.role == 'ADMIN' and entity.organization != user.organization:
                    raise serializers.ValidationError({
                        'entity': 'You can only create procedures for entities in your organization'
                    })
                if user.role == 'MANAGER' and entity.department != user.department:
                    raise serializers.ValidationError({
                        'entity': 'You can only create procedures for entities in your department'
                    })
        return attrs

    def create(self, validated_data):
        steps_data = validated_data.pop('steps', [])
        procedure = Procedure.objects.create(**validated_data)

        for i, step_data in enumerate(steps_data):
            step_data['step_order'] = step_data.get('step_order', i + 1)
            ProcedureStep.objects.create(procedure=procedure, **step_data)

        return procedure


class ProcedureUpdateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Procedure
        fields = [
            'title', 'description', 'priority',
            'interval_value', 'interval_unit', 'estimated_duration_minutes',
            'is_active', 'requires_approval', 'tags'
        ]


class ProcedureTemplateSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True, allow_null=True)

    class Meta:
        model = ProcedureTemplate
        fields = [
            'id', 'organization', 'organization_name',
            'name', 'description', 'category', 'template_data',
            'is_public', 'created_by', 'created_by_name',
            'usage_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class ProcedureTemplateListSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = ProcedureTemplate
        fields = [
            'id', 'organization', 'organization_name',
            'name', 'category', 'is_public', 'usage_count', 'created_at'
        ]


class ProcedureTemplateCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = ProcedureTemplate
        fields = ['organization', 'name', 'description', 'category', 'template_data', 'is_public']


class ProcedureFromTemplateSerializer(serializers.Serializer):
    template_id = serializers.IntegerField()
    entity_id = serializers.IntegerField()
    title = serializers.CharField(max_length=255, required=False)

    def validate_template_id(self, value):
        from django.db.models import Q
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError('Request context required')

        user = request.user
        template = ProcedureTemplate.objects.filter(
            Q(id=value) & (Q(organization=user.organization) | Q(is_public=True))
        ).first()

        if not template:
            raise serializers.ValidationError('Template not found or not accessible')
        return value

    def validate_entity_id(self, value):
        from apps.entities.models import Entity
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError('Request context required')

        user = request.user
        try:
            entity = Entity.objects.get(id=value, is_deleted=False)
            # Organization validation for non-SUPER_ADMIN users
            if user.role != 'SUPER_ADMIN' and entity.organization != user.organization:
                raise serializers.ValidationError('Entity not found or not accessible')
        except Entity.DoesNotExist:
            raise serializers.ValidationError('Entity not found')
        return value
