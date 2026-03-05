import re

from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from .models import NonComplianceIssue, IssueComment, HelpRequest

SAFE_PHOTO_URL_PATTERN = re.compile(r'^/?(media/)?[\w\-./]+\.(jpg|jpeg|png|gif|webp)$', re.IGNORECASE)


def validate_photo_urls(value):
    if not isinstance(value, list):
        raise serializers.ValidationError('photo_urls must be a list')
    for url in value:
        if not isinstance(url, str):
            raise serializers.ValidationError('Each photo URL must be a string')
        if '..' in url or url.startswith('/') and not url.startswith('/media/'):
            raise serializers.ValidationError(f'Invalid photo path: {url}')
        if not SAFE_PHOTO_URL_PATTERN.match(url):
            raise serializers.ValidationError(f'Invalid photo URL format: {url}')
    return value


class IssueCommentSerializer(MobileCompatibleSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = IssueComment
        fields = [
            'id', 'issue', 'user', 'user_name',
            'content', 'attachments', 'is_internal',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class IssueCommentCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = IssueComment
        fields = ['content', 'attachments', 'is_internal']


class NonComplianceIssueSerializer(MobileCompatibleSerializer):
    entity_name = serializers.CharField(source='entity.name', read_only=True)
    procedure_title = serializers.CharField(source='procedure_log.procedure.title', read_only=True)
    step_title = serializers.CharField(source='step_log.step.title', read_only=True, allow_null=True)
    reported_by_name = serializers.CharField(source='reported_by.full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.full_name', read_only=True, allow_null=True)
    assigned_to_department_name = serializers.CharField(source='assigned_to_department.name', read_only=True, allow_null=True)
    assigned_to_user_name = serializers.CharField(source='assigned_to_user.full_name', read_only=True, allow_null=True)
    comments = IssueCommentSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = NonComplianceIssue
        fields = [
            'id', 'entity', 'entity_name',
            'procedure_log', 'procedure_title',
            'step_log', 'step_title',
            'title', 'description', 'severity', 'status',
            'photo_urls', 'resolution_photo_urls', 'resolved_notes',
            'reported_by', 'reported_by_name',
            'resolved_by', 'resolved_by_name', 'resolved_at',
            'assigned_to_department', 'assigned_to_department_name',
            'assigned_to_user', 'assigned_to_user_name',
            'due_date', 'category', 'tags',
            'is_overdue', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'reported_by', 'created_at', 'updated_at']


class NonComplianceIssueCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = NonComplianceIssue
        fields = [
            'entity', 'procedure_log', 'step_log',
            'title', 'description', 'severity',
            'photo_urls', 'assigned_to_department', 'assigned_to_user',
            'due_date', 'category', 'tags'
        ]

    def validate_photo_urls(self, value):
        return validate_photo_urls(value)

    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user.role != 'SUPER_ADMIN':
            entity = attrs.get('entity')
            if entity and entity.organization != request.user.organization:
                raise serializers.ValidationError({'entity': 'Farklı organizasyonun kaynağına sorun bildirilemez'})
        return attrs


class NonComplianceIssueUpdateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = NonComplianceIssue
        fields = [
            'title', 'description', 'severity', 'status',
            'photo_urls', 'resolution_photo_urls', 'resolved_notes',
            'assigned_to_department', 'assigned_to_user',
            'due_date', 'category', 'tags'
        ]

    def validate_photo_urls(self, value):
        return validate_photo_urls(value)

    def validate_resolution_photo_urls(self, value):
        return validate_photo_urls(value)


class HelpRequestSerializer(MobileCompatibleSerializer):
    issue_title = serializers.CharField(source='issue.title', read_only=True)
    from_department_name = serializers.CharField(source='from_department.name', read_only=True)
    to_department_name = serializers.CharField(source='to_department.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.full_name', read_only=True)
    target_user_name = serializers.CharField(source='target_user.full_name', read_only=True, allow_null=True)
    responded_by_name = serializers.CharField(source='responded_by.full_name', read_only=True, allow_null=True)

    class Meta:
        model = HelpRequest
        fields = [
            'id', 'issue', 'issue_title',
            'from_department', 'from_department_name',
            'to_department', 'to_department_name',
            'requested_by', 'requested_by_name',
            'target_user', 'target_user_name',
            'message', 'status',
            'responded_by', 'responded_by_name',
            'response_message', 'responded_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'requested_by', 'created_at', 'updated_at']


class HelpRequestCreateSerializer(MobileCompatibleSerializer):
    class Meta:
        model = HelpRequest
        fields = ['issue', 'to_department', 'target_user', 'message']

    def validate(self, attrs):
        request = self.context.get('request')
        if request:
            user = request.user
            to_department = attrs.get('to_department')
            if to_department and to_department.organization != user.organization:
                raise serializers.ValidationError("Cannot request help from another organization")
        return attrs
