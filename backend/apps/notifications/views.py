from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsAuthenticatedAndActive

from apps.core.pagination import StandardResultsSetPagination
from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer, PushTokenCreateSerializer, PushTokenSerializer,
    NotificationPreferenceSerializer, SystemNotificationCreateSerializer
)
from .services import NotificationService, PushTokenService


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    serializer_class = NotificationSerializer

    def get_queryset(self):
        is_read_param = self.request.query_params.get('is_read')
        is_read = None
        if is_read_param == 'true':
            is_read = True
        elif is_read_param == 'false':
            is_read = False
            
        return NotificationService.get_user_notifications(self.request.user, is_read)

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        NotificationService.mark_as_read(notification, request.user)
        return Response({'success': True})

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        NotificationService.mark_all_as_read(request.user)
        return Response({'success': True, 'message': 'All notifications marked as read'})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'success': True, 'count': count})

    @action(detail=False, methods=['post'], url_path='register-push-token')
    def register_push_token(self, request):
        serializer = PushTokenCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = PushTokenService.register_token(
            user=request.user,
            **serializer.validated_data
        )

        return Response({
            'success': True,
            'message': 'Push token registered',
            'data': PushTokenSerializer(token).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get', 'patch'], url_path='preferences')
    def preferences(self, request):
        prefs, _ = NotificationPreference.objects.get_or_create(user=request.user)

        if request.method == 'GET':
            serializer = NotificationPreferenceSerializer(prefs)
            return Response({'success': True, 'data': serializer.data})

        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True, 'data': serializer.data})

    @action(detail=False, methods=['post'], url_path='send-system')
    def send_system(self, request):
        """Admin endpoint to send system notifications."""
        if request.user.role not in ['ADMIN', 'SUPER_ADMIN']:
            return Response(
                {'success': False, 'message': 'Bu işlem için yetkiniz yok.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SystemNotificationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        from apps.notifications.tasks import send_system_notification
        send_system_notification.delay(
            sender_user_id=request.user.id,
            title=data['title'],
            message=data['message'],
            priority=data.get('priority', 'NORMAL'),
            target=data['target'],
            department_id=data.get('department_id'),
            user_ids=data.get('user_ids'),
            action_url=data.get('action_url') or None,
        )

        return Response({
            'success': True,
            'message': 'Sistem bildirimi gönderildi.'
        }, status=status.HTTP_201_CREATED)
