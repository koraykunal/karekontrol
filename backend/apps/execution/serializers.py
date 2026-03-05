from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from .models import ProcedureLog, StepLog, StepReminder, ProcedureShare, Reminder


class IssueSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    status = serializers.CharField(read_only=True)
    resolved_at = serializers.DateTimeField(read_only=True, allow_null=True)
    title = serializers.CharField(read_only=True)
    severity = serializers.CharField(read_only=True)


class StepLogSerializer(MobileCompatibleSerializer):
    procedure_log_id = serializers.IntegerField(source='procedure_log.id', read_only=True)
    step_id = serializers.IntegerField(source='step.id', read_only=True)
    procedure_step_id = serializers.IntegerField(source='step.id', read_only=True)
    step_title = serializers.CharField(source='step.title', read_only=True)
    step_order = serializers.IntegerField(source='step.step_order', read_only=True)
    completed_by_user_id = serializers.IntegerField(source='completed_by_user.id', read_only=True, allow_null=True)
    completed_by_name = serializers.CharField(source='completed_by_user.full_name', read_only=True, allow_null=True)
    issues = serializers.SerializerMethodField()
    procedure_step = serializers.SerializerMethodField()

    class Meta:
        model = StepLog
        fields = [
            'id', 'procedure_log_id', 'step_id', 'procedure_step_id',
            'step_title', 'step_order',
            'completed_by_user_id', 'completed_by_name',
            'is_completed', 'is_compliant', 'completion_status',
            'has_blocking_issue', 'issues', 'notes', 'photo_url', 'photo_urls',
            'completed_at', 'checklist_results', 'duration_minutes',
            'completion_rate', 'procedure_step', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'completion_rate', 'created_at', 'updated_at']

    def get_issues(self, obj):
        # Return summary of related NonComplianceIssues
        return IssueSummarySerializer(obj.issues.all(), many=True).data

    def get_procedure_step(self, obj):
        from apps.procedures.serializers import ProcedureStepSerializer
        if obj.step:
            return ProcedureStepSerializer(obj.step).data
        return None


class StepLogUpdateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = StepLog
        fields = [
            'is_completed', 'is_compliant', 'notes',
            'photo_url', 'photo_urls', 'checklist_results'
        ]


class ProcedureLogSerializer(MobileCompatibleSerializer):
    procedure_id = serializers.IntegerField(source='procedure.id', read_only=True)
    entity_id = serializers.IntegerField(source='entity.id', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    procedure_title = serializers.CharField(source='procedure.title', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True, allow_null=True)
    completed_by_name = serializers.CharField(source='completed_by_user.full_name', read_only=True, allow_null=True)
    step_logs = StepLogSerializer(many=True, read_only=True)
    duration_formatted = serializers.CharField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    completed_steps = serializers.SerializerMethodField()
    total_steps = serializers.SerializerMethodField()
    compliance_rate = serializers.SerializerMethodField()
    total_duration_minutes = serializers.IntegerField(source='duration_minutes', read_only=True)
    procedure = serializers.SerializerMethodField()
    entity = serializers.SerializerMethodField()

    class Meta:
        model = ProcedureLog
        fields = [
            'id', 'procedure_id', 'entity_id', 'user_id',
            'organization_name', 'entity_name', 'procedure_title', 'user_name',
            'completed_by_name',
            'status', 'started_at', 'completed_at',
            'next_procedure_date',
            'has_unresolved_issues', 'blocked_by_issues', 'blocking_issues_count',
            'duration_minutes', 'duration_formatted', 'notes',
            'completion_percentage', 'is_overdue',
            'completed_steps', 'total_steps', 'compliance_rate', 'total_duration_minutes',
            'procedure', 'entity', 'step_logs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_overdue', 'duration_formatted', 'created_at', 'updated_at']

    def get_completed_steps(self, obj):
        # Optimization: use prefetched objects if available
        if hasattr(obj, '_prefetched_objects_cache') and 'step_logs' in obj._prefetched_objects_cache:
            return len([s for s in obj.step_logs.all() if s.is_completed])
        return obj.step_logs.filter(is_completed=True).count()

    def get_total_steps(self, obj):
        # Optimization: use prefetched objects if available
        if hasattr(obj, '_prefetched_objects_cache') and 'step_logs' in obj._prefetched_objects_cache:
            return len(obj.step_logs.all())
        return obj.step_logs.count()

    def get_compliance_rate(self, obj):
        # Optimization: use prefetched objects if available
        if hasattr(obj, '_prefetched_objects_cache') and 'step_logs' in obj._prefetched_objects_cache:
            steps = obj.step_logs.all()
            total = len([s for s in steps if s.is_completed])
            if total == 0:
                return 0
            compliant = len([s for s in steps if s.is_completed and s.completion_status == 'COMPLIANT'])
            return round((compliant / total) * 100, 2)
            
        total = obj.step_logs.filter(is_completed=True).count()
        if total == 0:
            return 0
        compliant = obj.step_logs.filter(is_completed=True, completion_status='COMPLIANT').count()
        return round((compliant / total) * 100, 2)

    def get_procedure(self, obj):
        from apps.procedures.serializers import ProcedureSerializer
        return ProcedureSerializer(obj.procedure).data

    def get_entity(self, obj):
        from apps.entities.serializers import EntityListSerializer
        return EntityListSerializer(obj.entity, context=self.context).data


class ProcedureLogListSerializer(MobileCompatibleSerializer):
    procedure_id = serializers.IntegerField(source='procedure.id', read_only=True)
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    procedure_title = serializers.CharField(source='procedure.title', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True, allow_null=True)
    started_by_name = serializers.CharField(source='user.full_name', read_only=True, allow_null=True)
    duration_formatted = serializers.CharField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    step_logs = StepLogSerializer(many=True, read_only=True)

    class Meta:
        model = ProcedureLog
        fields = [
            'id', 'procedure_id', 'entity_name', 'procedure_title', 'user_name', 'started_by_name',
            'status', 'started_at', 'completed_at',
            'completion_percentage', 'is_overdue', 'duration_formatted',
            'step_logs'
        ]


class ProcedureLogCreateSerializer(MobileCompatibleSerializer):
    procedure_id = serializers.IntegerField(write_only=True)
    entity_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ProcedureLog
        fields = ['procedure_id', 'entity_id', 'next_procedure_date', 'notes']

    def validate(self, attrs):
        from apps.procedures.models import Procedure
        from apps.entities.models import Entity
        
        request = self.context.get('request')
        procedure_id = attrs.pop('procedure_id')
        entity_id = attrs.pop('entity_id')

        try:
            procedure = Procedure.objects.get(id=procedure_id, is_deleted=False)
        except Procedure.DoesNotExist:
            raise serializers.ValidationError({"procedure_id": "Procedure not found"})

        try:
            entity = Entity.objects.get(id=entity_id, is_deleted=False)
        except Entity.DoesNotExist:
            raise serializers.ValidationError({"entity_id": "Entity not found"})

        attrs['procedure'] = procedure
        attrs['entity'] = entity

        if request:
            user = request.user

            if procedure.organization != entity.organization:
                raise serializers.ValidationError("Procedure and Entity must belong to the same organization")

            from apps.permissions.engine import PermissionEngine
            from apps.permissions.enums import PermissionKey
            perms = PermissionEngine.get_user_permissions(user)
            perm_config = perms.get(PermissionKey.CREATE_EXECUTIONS, {})
            scope = perm_config.get('scope', 'DEPARTMENT')

            if user.role == 'SUPER_ADMIN':
                pass
            elif scope in ['ALL', 'ORGANIZATION']:
                pass
            elif scope == 'DEPARTMENT':
                if entity.department != user.department:
                    raise serializers.ValidationError("Can only start procedures for your department's entities")
            else:
                 if entity.department != user.department:
                    raise serializers.ValidationError("Can only start procedures for your department's entities")

        return attrs


class ProcedureShareSerializer(MobileCompatibleSerializer):
    department_name = serializers.CharField(source='shared_with_department.name', read_only=True)
    shared_by_name = serializers.CharField(source='shared_by_user.full_name', read_only=True, allow_null=True)
    procedure_title = serializers.CharField(source='procedure_log.procedure.title', read_only=True)

    class Meta:
        model = ProcedureShare
        fields = [
            'id', 'procedure_log', 'procedure_title',
            'shared_with_department', 'department_name',
            'shared_by_user', 'shared_by_name',
            'reason', 'is_active', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'shared_by_user', 'created_at']


class ReminderSerializer(MobileCompatibleSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Reminder
        fields = [
            'id', 'user', 'user_name', 'title', 'description',
            'scheduled_for', 'is_completed', 'completed_at',
            'related_entity_type', 'related_entity_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'completed_at', 'created_at', 'updated_at']


class ReminderCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Reminder
        fields = [
            'title', 'description', 'scheduled_for',
            'related_entity_type', 'related_entity_id'
        ]


class ReminderUpdateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Reminder
        fields = ['title', 'description', 'scheduled_for', 'is_completed']


class StepReminderSerializer(MobileCompatibleSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    step_title = serializers.CharField(source='step_log.step.title', read_only=True)
    procedure_title = serializers.CharField(source='procedure_log.procedure.title', read_only=True)
    entity_name = serializers.CharField(source='procedure_log.entity.name', read_only=True)

    class Meta:
        model = StepReminder
        fields = [
            'id', 'user', 'user_name', 'step_log', 'procedure_log',
            'step_title', 'procedure_title', 'entity_name',
            'remind_at', 'message', 'is_sent', 'sent_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'is_sent', 'sent_at', 'created_at', 'updated_at']


class StepReminderCreateSerializer(MobileCompatibleSerializer):
    step_log_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = StepReminder
        fields = ['step_log_id', 'remind_at', 'message']

    def validate_step_log_id(self, value):
        try:
            self._step_log = StepLog.objects.select_related('procedure_log').get(id=value)
        except StepLog.DoesNotExist:
            raise serializers.ValidationError("Step log not found")
        return value

    def create(self, validated_data):
        validated_data.pop('step_log_id')
        user = self.context['request'].user
        step_log = self._step_log

        return StepReminder.objects.create(
            user=user,
            step_log=step_log,
            procedure_log=step_log.procedure_log,
            **validated_data
        )

