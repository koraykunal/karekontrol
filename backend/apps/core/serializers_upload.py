from rest_framework import serializers


class ImageUploadSerializer(serializers.Serializer):
    file = serializers.ImageField(required=True)
    category = serializers.ChoiceField(
        choices=['entity', 'step_log', 'issue', 'profile', 'other'],
        required=False,
        default='other'
    )


class VideoUploadSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)
    category = serializers.ChoiceField(
        choices=['step_log', 'videos', 'issue', 'other'],
        required=False,
        default='step_log'
    )
    duration = serializers.IntegerField(required=False, max_value=10, min_value=1)

    def validate(self, data):
        file = data.get('file')
        if file.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("Video file too large. Maximum size is 50MB.")
        return data


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)
    category = serializers.ChoiceField(
        choices=['entity', 'procedure', 'report', 'other'],
        required=False,
        default='other'
    )


class UploadResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    url = serializers.CharField()
    filename = serializers.CharField()
    size = serializers.IntegerField()
    content_type = serializers.CharField()
