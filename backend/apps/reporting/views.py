import re
from urllib.parse import quote

from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.core.permissions import IsAuthenticatedAndActive, IsAdmin, IsManager
from apps.core.pagination import StandardResultsSetPagination
from apps.core.constants import ReportType, ReportTriggerType, ReportStatus
from .models import Report, ReportSchedule
from .serializers import (
    ReportSerializer, ReportCreateSerializer,
    ReportScheduleSerializer
)
from .services import ReportingService


def _sanitize_filename(name: str) -> str:
    safe = re.sub(r'[^\w\s\-.]', '', name).strip()
    return safe[:200] or 'report'


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['report_type', 'status', 'department', 'period_year']
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return ReportingService.get_reports_for_user(self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return ReportCreateSerializer
        return ReportSerializer

    def get_permissions(self):
        if self.action in ['create', 'generate_procedure_report']:
            return [IsAuthenticatedAndActive(), IsManager()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        from .tasks import generate_report_task

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            report = serializer.save(
                organization=request.user.organization,
                generated_by_user=request.user,
                triggered_by=ReportTriggerType.MANUAL,
                status=ReportStatus.PENDING,
            )
            transaction.on_commit(lambda: generate_report_task.delay(report.id))

        return Response({
            'success': True,
            'message': 'Rapor oluşturma başlatıldı',
            'data': ReportSerializer(report).data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        report = self.get_object()

        if not report.file:
            return Response({
                'success': False,
                'message': 'Rapor dosyasi hazir degil',
            }, status=status.HTTP_404_NOT_FOUND)

        ReportingService.mark_downloaded(report, request.user)

        safe_title = _sanitize_filename(report.title)
        encoded_title = quote(f'{safe_title}.pdf')
        response = FileResponse(report.file.open('rb'), content_type='application/pdf')
        response['Content-Disposition'] = f"inline; filename*=UTF-8''{encoded_title}"
        return response

    @action(detail=False, methods=['post'], url_path='generate-procedure-report')
    def generate_procedure_report(self, request):
        from apps.execution.models import ProcedureLog
        from apps.execution.services import ExecutionService
        from .tasks import generate_report_task

        procedure_log_id = request.data.get('procedure_log_id')
        if not procedure_log_id:
            return Response({
                'success': False,
                'message': 'procedure_log_id gereklidir',
            }, status=status.HTTP_400_BAD_REQUEST)

        user_logs = ExecutionService.get_logs_for_user(request.user).filter(
            id=procedure_log_id, status='COMPLETED',
        )

        if not user_logs.exists():
            return Response({
                'success': False,
                'message': 'Tamamlanmis prosedur kaydi bulunamadi veya erisim yetkiniz yok',
            }, status=status.HTTP_404_NOT_FOUND)

        log = user_logs.select_related('procedure', 'entity', 'organization').first()

        existing = Report.objects.filter(
            metadata__procedure_log_id=procedure_log_id,
            report_type=ReportType.PROCEDURE,
            status__in=[ReportStatus.PENDING, ReportStatus.GENERATING, ReportStatus.COMPLETED],
        ).first()

        if existing:
            return Response({
                'success': True,
                'message': 'Rapor zaten mevcut',
                'data': ReportSerializer(existing).data,
            })

        now = timezone.now()
        with transaction.atomic():
            report = Report.objects.create(
                organization=log.organization,
                department=log.entity.department if log.entity else None,
                report_type=ReportType.PROCEDURE,
                period_month=now.month,
                period_year=now.year,
                title=f"{log.procedure.title} - {log.entity.name} Tamamlanma Raporu",
                generated_by_user=request.user,
                triggered_by=ReportTriggerType.MANUAL,
                status=ReportStatus.PENDING,
                valid_from=now.date(),
                metadata={'procedure_log_id': procedure_log_id},
            )
            transaction.on_commit(lambda: generate_report_task.delay(report.id))

        return Response({
            'success': True,
            'message': 'Rapor olusturma baslatildi',
            'data': ReportSerializer(report).data,
        }, status=status.HTTP_201_CREATED)


class ReportScheduleViewSet(viewsets.ModelViewSet):
    queryset = ReportSchedule.objects.all()
    permission_classes = [IsAuthenticatedAndActive, IsAdmin]
    serializer_class = ReportScheduleSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return ReportingService.get_user_schedules(self.request.user)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
