from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.core.permissions import IsAuthenticatedAndActive
from django.db.models import Q

from apps.core.pagination import StandardResultsSetPagination
from apps.core.exceptions import AuthorizationError
from apps.permissions.engine import PermissionEngine
from apps.permissions.enums import PermissionKey
from .models import NonComplianceIssue, HelpRequest
from .serializers import (
    NonComplianceIssueSerializer, NonComplianceIssueCreateSerializer, NonComplianceIssueUpdateSerializer,
    IssueCommentSerializer, IssueCommentCreateSerializer,
    HelpRequestSerializer, HelpRequestCreateSerializer
)
from .services import ComplianceService


class NonComplianceIssueViewSet(viewsets.ModelViewSet):
    queryset = NonComplianceIssue.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'severity', 'entity', 'assigned_to_department']
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['created_at', 'priority', 'due_date']
    ordering = ['-created_at']

    def get_queryset(self):
        return ComplianceService.get_issues_for_user(self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return NonComplianceIssueCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NonComplianceIssueUpdateSerializer
        return NonComplianceIssueSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        issue = ComplianceService.report_issue(
            user=request.user,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'message': 'Issue reported successfully',
            'data': NonComplianceIssueSerializer(issue).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        issue = ComplianceService.update_issue(instance, **serializer.validated_data)
        
        return Response({
            'success': True,
            'message': 'Issue updated successfully',
            'data': NonComplianceIssueSerializer(issue).data
        })

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        if not PermissionEngine.check(request.user, PermissionKey.RESOLVE_ISSUES):
            raise AuthorizationError('You do not have permission to resolve issues')
        issue = self.get_object()
        notes = request.data.get('notes')
        photos = request.data.get('photos')
        
        issue = ComplianceService.resolve_issue(issue, request.user, notes, photos)
        
        return Response({
            'success': True,
            'message': 'Issue resolved successfully',
            'data': NonComplianceIssueSerializer(issue).data
        })

    @action(detail=True, methods=['post'], url_path='comments')
    def add_comment(self, request, pk=None):
        issue = self.get_object()
        serializer = IssueCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        comment = ComplianceService.add_comment(
            issue=issue,
            user=request.user,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'message': 'Comment added',
            'data': IssueCommentSerializer(comment).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='comments')
    def get_comments(self, request, pk=None):
        issue = self.get_object()
        comments = issue.comments.select_related('user').all()
        return Response({
            'success': True,
            'data': IssueCommentSerializer(comments, many=True).data
        })


class HelpRequestViewSet(viewsets.ModelViewSet):
    queryset = HelpRequest.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = HelpRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return HelpRequest.objects.all()
        if not user.department:
            return HelpRequest.objects.none()
        return HelpRequest.objects.filter(
            Q(from_department=user.department) |
            Q(to_department=user.department)
        )
    
    def create(self, request, *args, **kwargs):
        serializer = HelpRequestCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        help_request = ComplianceService.create_help_request(
            user=request.user,
            **serializer.validated_data
        )
        
        return Response({
            'success': True,
            'message': 'Help request sent',
            'data': HelpRequestSerializer(help_request).data
        }, status=status.HTTP_201_CREATED)

    pagination_class = StandardResultsSetPagination

    @action(detail=True, methods=['post'], url_path='respond')
    def respond(self, request, pk=None):
        help_request = self.get_object()
        if request.user.department != help_request.to_department and request.user.role not in ['ADMIN', 'SUPER_ADMIN']:
            return Response({'success': False, 'message': 'Sadece hedef departman yanıt verebilir'}, status=status.HTTP_403_FORBIDDEN)
        status_val = request.data.get('status')
        VALID_STATUSES = ['ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED']
        if status_val not in VALID_STATUSES:
            return Response({'success': False, 'message': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        message = request.data.get('message')

        help_request = ComplianceService.respond_to_help_request(
            help_request, request.user, status_val, message
        )
        
        return Response({
            'success': True,
            'message': 'Response recorded',
            'data': HelpRequestSerializer(help_request).data
        })