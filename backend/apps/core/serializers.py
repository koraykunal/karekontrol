from rest_framework import serializers


class UppercaseChoiceFieldSerializerMixin:
    """Ensures all choice fields are returned as UPPERCASE for API consistency."""
    def to_representation(self, instance):
        ret = super().to_representation(instance)

        choice_fields = ['role', 'priority', 'interval_unit', 'severity', 'status',
                        'action', 'scope', 'resource_type', 'type', 'device_type',
                        'report_type', 'triggered_by', 'frequency', 'delivery_method',
                        'document_type', 'entity_type', 'completion_status']

        for field_name in choice_fields:
            if field_name in ret and ret[field_name]:
                if isinstance(ret[field_name], str):
                    ret[field_name] = ret[field_name].upper()

        return ret


class MobileCompatibleSerializer(UppercaseChoiceFieldSerializerMixin, serializers.ModelSerializer):
    pass


class BaseResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(required=False)
    data = serializers.JSONField(required=False)


class ErrorResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=False)
    error = serializers.CharField()
    message = serializers.CharField(required=False)
    details = serializers.JSONField(required=False)
