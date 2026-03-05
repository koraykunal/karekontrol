from django.core.validators import MinValueValidator, MaxValueValidator
from rest_framework import serializers
from apps.core.serializers import MobileCompatibleSerializer
from .models import Report, ReportSchedule


class ReportSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    generated_by_name = serializers.CharField(source='generated_by_user.full_name', read_only=True, allow_null=True)

    class Meta:
        model = Report
        fields = [
            'id', 'organization', 'organization_name',
            'department', 'department_name',
            'report_type', 'period_month', 'period_year',
            'title', 'description', 'file', 'file_size',
            'generated_by_user', 'generated_by_name',
            'triggered_by', 'valid_from', 'valid_until',
            'status', 'error_message',
            'total_procedures', 'completed_procedures',
            'pending_procedures', 'non_compliance_count',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization', 'organization_name',
            'department', 'department_name',
            'report_type', 'period_month', 'period_year',
            'title', 'description', 'file', 'file_size',
            'generated_by_user', 'generated_by_name',
            'triggered_by', 'valid_from', 'valid_until',
            'status', 'error_message',
            'total_procedures', 'completed_procedures',
            'pending_procedures', 'non_compliance_count',
            'metadata', 'created_at', 'updated_at'
        ]


class ReportCreateSerializer(MobileCompatibleSerializer):
    title = serializers.CharField(required=False, allow_blank=True, max_length=255)
    valid_from = serializers.DateField(required=False)

    class Meta:
        model = Report
        fields = [
            'department', 'report_type', 'period_month', 'period_year',
            'title', 'description', 'valid_from', 'valid_until'
        ]

    def validate_period_month(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError("Ay 1-12 arasinda olmalidir")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request:
            department = attrs.get('department')
            if department and department.organization != request.user.organization:
                raise serializers.ValidationError("Farkli bir organizasyonun departmani secilemez")

        if not attrs.get('title'):
            report_type = attrs.get('report_type', '')
            period = f"{attrs.get('period_month', '')}/{attrs.get('period_year', '')}"
            attrs['title'] = f"{report_type} Raporu - {period}"

        if not attrs.get('valid_from'):
            from django.utils import timezone
            attrs['valid_from'] = timezone.now().date()

        return attrs


class ReportScheduleSerializer(MobileCompatibleSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)

    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'organization', 'organization_name',
            'department', 'department_name',
            'is_active', 'report_type', 'frequency',
            'trigger_day_of_month', 'trigger_hour', 'trigger_minute',
            'timezone', 'recipient_email_list',
            'should_notify_department_head', 'should_notify_compliance_officer',
            'last_run', 'next_run', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization', 'organization_name',
            'last_run', 'next_run', 'created_at', 'updated_at'
        ]

    def validate_trigger_day_of_month(self, value):
        if value < 1 or value > 31:
            raise serializers.ValidationError("Gun 1-31 arasinda olmalidir")
        return value

    def validate_trigger_hour(self, value):
        if value > 23:
            raise serializers.ValidationError("Saat 0-23 arasinda olmalidir")
        return value

    def validate_trigger_minute(self, value):
        if value > 59:
            raise serializers.ValidationError("Dakika 0-59 arasinda olmalidir")
        return value

    def validate_department(self, value):
        if value:
            request = self.context.get('request')
            if request and value.organization != request.user.organization:
                raise serializers.ValidationError("Farkli bir organizasyonun departmani secilemez")
        return value
