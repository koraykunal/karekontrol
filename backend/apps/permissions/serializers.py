from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from .models import ProcedureAssignment, PermissionPolicy
import json


class ProcedureAssignmentSerializer(MobileCompatibleSerializer):
    procedure_title = serializers.CharField(source='procedure.title', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to_user.full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by_user.full_name', read_only=True, allow_null=True)

    class Meta:
        model = ProcedureAssignment
        fields = [
            'id', 'procedure', 'procedure_title',
            'assigned_to_user', 'assigned_to_name',
            'assigned_by_user', 'assigned_by_name',
            'assignment_reason', 'assignment_notes',
            'valid_from', 'valid_until', 'status',
            'is_active', 'recurring',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_by_user', 'created_at', 'updated_at']


class ProcedureAssignmentCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = ProcedureAssignment
        fields = [
            'procedure', 'assigned_to_user', 'assignment_reason',
            'assignment_notes', 'valid_from', 'valid_until',
            'recurring'
        ]


class PermissionPolicySerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    configured_by_name = serializers.CharField(source='configured_by.full_name', read_only=True, allow_null=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    permissions = serializers.JSONField()

    class Meta:
        model = PermissionPolicy
        fields = [
            'id', 'organization', 'organization_name',
            'department', 'department_name',
            'role', 'role_display', 'permissions',
            'is_active', 'configured_by', 'configured_by_name',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'department', 'configured_by', 'created_at', 'updated_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if isinstance(ret.get('permissions'), str):
            try:
                ret['permissions'] = json.loads(ret['permissions'])
            except:
                pass
        return ret
