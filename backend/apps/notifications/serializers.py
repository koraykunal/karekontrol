from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from .models import Notification, PushToken, NotificationPreference


class NotificationSerializer(MobileCompatibleSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'entity', 'procedure_log', 'step_log', 'issue',
            'type', 'title', 'message', 'priority',
            'is_read', 'is_persistent', 'read_at', 'action_url', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'is_persistent', 'created_at']


class PushTokenSerializer(MobileCompatibleSerializer):
    class Meta:
        model = PushToken
        fields = ['id', 'user', 'token', 'device_type', 'device_name', 'is_active', 'last_used_at']
        read_only_fields = ['id', 'user', 'last_used_at']


class PushTokenCreateSerializer(MobileCompatibleSerializer):
    device_type = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PushToken
        fields = ['token', 'device_type', 'device_name']

    def validate_device_type(self, value):
        if value:
            return value.upper()
        return value


class SystemNotificationCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    priority = serializers.ChoiceField(choices=['LOW', 'NORMAL', 'HIGH', 'URGENT'], default='NORMAL')
    target = serializers.ChoiceField(choices=['all', 'department', 'users'])
    department_id = serializers.IntegerField(required=False)
    user_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    action_url = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, data):
        target = data.get('target')
        if target == 'department' and not data.get('department_id'):
            raise serializers.ValidationError({'department_id': 'Department ID is required for department target.'})
        if target == 'users' and not data.get('user_ids'):
            raise serializers.ValidationError({'user_ids': 'User IDs are required for users target.'})
        return data


class NotificationPreferenceSerializer(MobileCompatibleSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'procedure_due_enabled', 'procedure_overdue_enabled',
            'issue_enabled', 'help_request_enabled',
            'push_enabled', 'reminder_days_before',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
        ]
