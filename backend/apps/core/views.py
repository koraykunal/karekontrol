from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count, Q, Avg
from django.utils import timezone
from django.core.files.storage import default_storage
from django.conf import settings
from datetime import timedelta
import os
import uuid

from apps.core.permissions import IsAuthenticatedAndActive, IsManager
from apps.core.constants import ProcedureLogStatus, AssignmentStatus
from apps.core.serializers_upload import ImageUploadSerializer, VideoUploadSerializer, FileUploadSerializer
from apps.core.file_validators import validate_file_upload
from apps.procedures.models import Procedure
from apps.permissions.models import ProcedureAssignment
from apps.execution.models import ProcedureLog
from apps.compliance.models import NonComplianceIssue
from apps.authentication.models import User
from apps.audit.models import AuditLog


class DashboardViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticatedAndActive]

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        user = request.user
        organization = user.organization

        if user.role == 'SUPER_ADMIN':
            procedures = Procedure.objects.filter(is_deleted=False)
            assignments = ProcedureAssignment.objects.all()
            logs = ProcedureLog.objects.all()
            issues = NonComplianceIssue.objects.all()
            users = User.objects.filter(is_active=True)
        elif user.role == 'ADMIN':
            procedures = Procedure.objects.filter(organization=organization, is_deleted=False)
            assignments = ProcedureAssignment.objects.filter(procedure__organization=organization)
            logs = ProcedureLog.objects.filter(procedure__organization=organization)
            issues = NonComplianceIssue.objects.filter(entity__organization=organization)
            users = User.objects.filter(organization=organization, is_active=True)
        elif user.role == 'MANAGER':
            procedures = Procedure.objects.filter(
                organization=organization,
                entity__department=user.department,
                is_deleted=False
            )
            assignments = ProcedureAssignment.objects.filter(
                procedure__entity__department=user.department
            )
            logs = ProcedureLog.objects.filter(procedure__entity__department=user.department)
            issues = NonComplianceIssue.objects.filter(entity__department=user.department)
            users = User.objects.filter(department=user.department, is_active=True)
        else:
            assignments = ProcedureAssignment.objects.filter(assigned_to_user=user)
            logs = ProcedureLog.objects.filter(user=user)
            issues = NonComplianceIssue.objects.filter(reported_by=user)
            users = User.objects.filter(id=user.id)
            procedures = Procedure.objects.filter(
                id__in=assignments.values_list('procedure_id', flat=True)
            )

        assignment_stats = assignments.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status=AssignmentStatus.COMPLETED)),
            pending=Count('id', filter=Q(status=AssignmentStatus.PENDING))
        )

        return Response({
            'success': True,
            'data': {
                'total_procedures': procedures.count(),
                'total_assignments': assignment_stats['total'],
                'completed_assignments': assignment_stats['completed'],
                'pending_assignments': assignment_stats['pending'],
                'active_employees': users.count(),
                'compliance_issues': issues.filter(status__in=['OPEN', 'IN_PROGRESS']).count()
            }
        })

    @action(detail=False, methods=['get'], url_path='manager/stats', permission_classes=[IsManager])
    def manager_stats(self, request):
        user = request.user
        department = user.department

        if not department:
            return Response({
                'success': False,
                'message': 'User is not assigned to a department'
            }, status=status.HTTP_400_BAD_REQUEST)

        team_members = User.objects.filter(department=department, is_active=True)
        department_procedures = Procedure.objects.filter(
            entity__department=department,
            is_deleted=False
        )

        recent_logs = ProcedureLog.objects.filter(
            procedure__entity__department=department,
            created_at__gte=timezone.now() - timedelta(days=30)
        )

        completed_logs = recent_logs.filter(status=ProcedureLogStatus.COMPLETED)

        department_issues = NonComplianceIssue.objects.filter(
            entity__department=department
        )

        open_issues = department_issues.filter(status__in=['OPEN', 'IN_PROGRESS']).count()
        resolved_issues = department_issues.filter(status__in=['RESOLVED', 'VERIFIED', 'CLOSED']).count()

        compliance_rate = 0
        if recent_logs.exists():
            # Use aggregate to avoid N+1 query problem
            from apps.execution.models import StepLog
            from django.db.models import Count

            step_stats = StepLog.objects.filter(
                procedure_log__in=completed_logs
            ).aggregate(
                total=Count('id'),
                compliant=Count('id', filter=Q(completion_status='COMPLIANT'))
            )

            total_steps = step_stats['total'] or 0
            compliant_steps = step_stats['compliant'] or 0

            if total_steps > 0:
                compliance_rate = round((compliant_steps / total_steps) * 100, 2)

        return Response({
            'success': True,
            'data': {
                'team_size': team_members.count(),
                'active_procedures': department_procedures.filter(is_active=True).count(),
                'completed_procedures_last_30_days': completed_logs.count(),
                'pending_procedures': recent_logs.filter(status=ProcedureLogStatus.IN_PROGRESS).count(),
                'compliance_rate': compliance_rate,
                'open_issues': open_issues,
                'resolved_issues': resolved_issues,
                'department_name': department.name
            }
        })

    @action(detail=False, methods=['get'], url_path='activity')
    def activity(self, request):
        user = request.user
        limit = min(int(request.query_params.get('limit', 20)), 100)

        if user.role == 'SUPER_ADMIN':
            activities = AuditLog.objects.all()
        elif user.role == 'ADMIN':
            activities = AuditLog.objects.filter(
                user__organization=user.organization
            )
        elif user.role == 'MANAGER':
            activities = AuditLog.objects.filter(
                user__department=user.department
            )
        else:
            activities = AuditLog.objects.filter(user=user)

        activities = activities.select_related('user').order_by('-created_at')[:limit]

        activity_data = []
        for activity in activities:
            activity_data.append({
                'id': activity.id,
                'user_id': activity.user_id,
                'user_name': activity.user.full_name if activity.user else None,
                'action': activity.action,
                'resource_type': activity.resource_type,
                'resource_id': activity.resource_id,
                'details': activity.details,
                'created_at': activity.created_at.isoformat()
            })

        return Response({
            'success': True,
            'data': activity_data
        })


class UploadViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticatedAndActive]
    parser_classes = [MultiPartParser, FormParser]

    ALLOWED_UPLOAD_CATEGORIES = ['images', 'videos', 'documents', 'procedures', 'step_log', 'other']
    MAX_FILE_SIZE = 50 * 1024 * 1024

    def create(self, request):
        file = request.FILES.get('file')

        if not file:
            return Response({
                'success': False,
                'message': 'Dosya sağlanmadı'
            }, status=status.HTTP_400_BAD_REQUEST)

        if file.size > self.MAX_FILE_SIZE:
            return Response({
                'success': False,
                'message': f'Dosya boyutu {self.MAX_FILE_SIZE // (1024 * 1024)}MB limitini aşıyor'
            }, status=status.HTTP_400_BAD_REQUEST)

        category = request.data.get('category', 'other')
        if category not in self.ALLOWED_UPLOAD_CATEGORIES:
            category = 'other'

        try:
            file_mime, file_ext = validate_file_upload(file, category)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        if file_mime.startswith('image/'):
            serializer = ImageUploadSerializer(data=request.data)
        elif file_mime.startswith('video/'):
            serializer = VideoUploadSerializer(data=request.data)
        else:
            serializer = FileUploadSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        unique_filename = f"{uuid.uuid4().hex}{file_ext}"

        today = timezone.now().strftime('%Y/%m/%d')
        org_id = 'common'
        if request.user and request.user.organization_id:
            org_id = str(request.user.organization_id)
            
        upload_path = os.path.join('uploads', f"org_{org_id}", category, today, unique_filename)

        saved_path = default_storage.save(upload_path, file)
        file_url = default_storage.url(saved_path)

        if file_url.startswith('/'):
            file_url = request.build_absolute_uri(file_url)

        return Response({
            'success': True,
            'url': file_url,
            'filename': file.name,
            'size': file.size,
            'content_type': file.content_type
        }, status=status.HTTP_201_CREATED)
