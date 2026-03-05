import logging
import calendar
from datetime import date

from celery import shared_task
from django.core.files.base import ContentFile
from django.db import models
from django.db.models import Count, Q, F
from django.utils import timezone

from apps.core.constants import (
    ReportType, ReportStatus, ReportTriggerType,
    ProcedureLogStatus, IssueStatus, NotificationType,
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=120, rate_limit='1/m')
def generate_report_task(self, report_id: int):
    from .models import Report

    try:
        report = Report.objects.select_related('organization', 'department').get(id=report_id)
    except Report.DoesNotExist:
        logger.warning("Report %d not found, skipping.", report_id)
        return

    if report.status == ReportStatus.COMPLETED:
        logger.info("Report %d already completed, skipping.", report_id)
        return

    report.status = ReportStatus.GENERATING
    report.error_message = None
    report.save(update_fields=['status', 'error_message'])

    try:
        if report.report_type == ReportType.PROCEDURE:
            pdf_bytes = _generate_procedure_report(report)
        elif report.report_type == ReportType.ORGANIZATION:
            pdf_bytes = _generate_organization_report(report)
        else:
            report.status = ReportStatus.FAILED
            report.error_message = f"Desteklenmeyen rapor turu: {report.report_type}"
            report.save(update_fields=['status', 'error_message'])
            return

        if pdf_bytes is None:
            raise RuntimeError("PDF olusturma basarisiz")

        filename = f"report_{report.id}_{report.report_type.lower()}_{report.period_month}_{report.period_year}.pdf"
        report.file.save(filename, ContentFile(pdf_bytes), save=False)
        report.file_size = len(pdf_bytes)
        report.status = ReportStatus.COMPLETED
        report.save(update_fields=['file', 'file_size', 'status'])

        _notify_report_ready(report)
        logger.info("Report %d generated successfully (%d bytes).", report_id, len(pdf_bytes))

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            report.status = ReportStatus.FAILED
            report.error_message = str(exc)[:500]
            report.save(update_fields=['status', 'error_message'])
            logger.error("Report %d generation permanently failed: %s", report_id, exc, exc_info=True)
            return
        logger.warning("Report %d generation attempt %d failed, retrying: %s", report_id, self.request.retries + 1, exc)
        raise self.retry(exc=exc)


@shared_task
def generate_monthly_reports():
    from apps.organizations.models import Organization
    from .models import Report

    now = timezone.now()
    prev_month = now.month - 1 if now.month > 1 else 12
    prev_year = now.year if now.month > 1 else now.year - 1

    count = 0
    for org in Organization.objects.filter(is_active=True):
        already_exists = Report.objects.filter(
            organization=org,
            report_type=ReportType.ORGANIZATION,
            period_month=prev_month,
            period_year=prev_year,
            status__in=[ReportStatus.PENDING, ReportStatus.GENERATING, ReportStatus.COMPLETED],
        ).exists()

        if already_exists:
            continue

        _, last_day = calendar.monthrange(prev_year, prev_month)

        report = Report.objects.create(
            organization=org,
            report_type=ReportType.ORGANIZATION,
            period_month=prev_month,
            period_year=prev_year,
            title=f"{org.name} - {prev_month}/{prev_year} Aylik Rapor",
            triggered_by=ReportTriggerType.AUTOMATIC,
            status=ReportStatus.PENDING,
            valid_from=date(prev_year, prev_month, 1),
            valid_until=date(prev_year, prev_month, last_day),
        )

        generate_report_task.delay(report.id)
        count += 1

    logger.info("Monthly report generation triggered for %d/%d: %d organizations.", prev_month, prev_year, count)


@shared_task
def cleanup_old_report_files(days=180):
    from .models import Report

    cutoff = timezone.now() - timezone.timedelta(days=days)

    old_reports = Report.objects.filter(
        created_at__lt=cutoff,
        status=ReportStatus.COMPLETED,
    ).exclude(file='').exclude(file__isnull=True)

    cleaned = 0
    for report in old_reports.iterator():
        try:
            report.file.delete(save=False)
            report.file = ''
            report.save(update_fields=['file'])
            cleaned += 1
        except Exception:
            logger.warning("Failed to cleanup report file: %d", report.id, exc_info=True)

    logger.info("Cleaned up %d old report files (older than %d days).", cleaned, days)
    return cleaned


REPORT_PHOTO_MAX_WIDTH = 800
REPORT_PHOTO_MAX_HEIGHT = 600
REPORT_PHOTO_QUALITY = 65


def _compress_image_to_base64(abs_path):
    import io
    import base64
    from PIL import Image

    try:
        img = Image.open(abs_path)
    except Exception:
        logger.warning("Failed to open image: %s", abs_path)
        return None

    if img.mode in ('RGBA', 'P', 'LA'):
        img = img.convert('RGB')

    img.thumbnail((REPORT_PHOTO_MAX_WIDTH, REPORT_PHOTO_MAX_HEIGHT), Image.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=REPORT_PHOTO_QUALITY, optimize=True)
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode('utf-8')
    return f'data:image/jpeg;base64,{encoded}'


def _resolve_photos_as_base64(urls):
    import os
    from pathlib import Path
    from io import BytesIO
    from urllib.parse import urlparse
    from django.conf import settings
    from django.core.files.storage import default_storage

    results = []
    if not urls:
        return results

    media_root = str(settings.MEDIA_ROOT)
    media_url = settings.MEDIA_URL
    use_s3 = hasattr(default_storage, 'bucket')

    for url in urls:
        if not isinstance(url, str) or not url.strip():
            continue

        parsed = urlparse(url)
        path_part = parsed.path if parsed.scheme else url

        if path_part.startswith(media_url):
            path_part = path_part[len(media_url):]
        elif path_part.startswith('/'):
            path_part = path_part.lstrip('/')

        if use_s3:
            try:
                if not default_storage.exists(path_part):
                    logger.debug("Photo not found in storage: %s", path_part)
                    continue
                f = default_storage.open(path_part)
                buf = BytesIO(f.read())
                f.close()
                data_uri = _compress_image_to_base64(buf)
            except Exception:
                logger.debug("Failed to read photo from storage: %s", path_part, exc_info=True)
                continue
        else:
            abs_path = os.path.join(media_root, path_part.replace('/', os.sep))
            resolved = Path(abs_path).resolve()
            if not str(resolved).startswith(str(Path(media_root).resolve())):
                continue
            if not os.path.isfile(abs_path):
                logger.debug("Photo file not found: %s (resolved to %s)", url, abs_path)
                continue
            data_uri = _compress_image_to_base64(abs_path)

        if data_uri:
            results.append(data_uri)

    return results


def _generate_procedure_report(report):
    from apps.execution.models import ProcedureLog
    from apps.compliance.models import NonComplianceIssue
    from .pdf_generator import PDFGenerator
    from .charts import generate_compliance_chart

    procedure_log_id = report.metadata.get('procedure_log_id')
    if not procedure_log_id:
        raise ValueError("procedure_log_id missing from report metadata")

    log = ProcedureLog.objects.select_related(
        'procedure', 'entity', 'entity__department',
        'user', 'completed_by_user', 'organization',
    ).prefetch_related(
        'step_logs', 'step_logs__step', 'step_logs__completed_by_user',
    ).get(id=procedure_log_id)

    step_logs = list(log.step_logs.all().order_by('step__step_order'))
    total_steps = len(step_logs)
    compliant = sum(1 for s in step_logs if s.completion_status == 'COMPLIANT')
    non_compliant = sum(1 for s in step_logs if s.completion_status == 'NON_COMPLIANT')
    skipped = sum(1 for s in step_logs if s.completion_status == 'SKIPPED')
    completed_count = compliant + non_compliant + skipped
    compliance_rate = round((compliant / completed_count * 100), 1) if completed_count > 0 else 0

    compliance_chart = generate_compliance_chart(compliant, non_compliant, skipped)

    issues = NonComplianceIssue.objects.filter(
        procedure_log=log,
    ).select_related('assigned_to_department', 'assigned_to_user', 'reported_by')

    report.total_procedures = 1
    report.completed_procedures = 1 if log.status == ProcedureLogStatus.COMPLETED else 0
    report.non_compliance_count = issues.count()
    report.save(update_fields=['total_procedures', 'completed_procedures', 'non_compliance_count'])

    step_data = []
    for s in step_logs:
        step_data.append({
            'step_order': s.step.step_order if s.step else 0,
            'step_title': s.step.title if s.step else f"Adim #{s.id}",
            'completion_status': s.completion_status or '',
            'completed_by_name': s.completed_by_user.full_name if s.completed_by_user else None,
            'completed_at_formatted': s.completed_at.strftime('%d.%m.%Y %H:%M') if s.completed_at else None,
            'duration_minutes': s.duration_minutes,
            'notes': s.notes or '',
        })

    issue_data = []
    for i in issues:
        photos = _resolve_photos_as_base64(i.photo_urls)
        issue_data.append({
            'title': i.title,
            'severity': i.severity,
            'status': i.status,
            'description': i.description,
            'reported_by_name': i.reported_by.full_name if i.reported_by else '-',
            'assigned_to_name': i.assigned_to_user.full_name if i.assigned_to_user else None,
            'assigned_dept_name': i.assigned_to_department.name if i.assigned_to_department else None,
            'due_date': i.due_date.strftime('%d.%m.%Y') if i.due_date else None,
            'resolved_notes': i.resolved_notes or '',
            'photos': photos,
            'photo_count': len(photos),
        })

    context = {
        'organization_name': log.organization.name,
        'generation_date': timezone.now().strftime('%d.%m.%Y %H:%M'),
        'procedure_title': log.procedure.title if log.procedure else f"Prosedur #{log.procedure_id}",
        'entity_name': log.entity.name if log.entity else '-',
        'entity_code': log.entity.code if log.entity else '-',
        'department_name': log.entity.department.name if log.entity and log.entity.department else None,
        'started_at': log.started_at.strftime('%d.%m.%Y %H:%M') if log.started_at else '-',
        'completed_at': log.completed_at.strftime('%d.%m.%Y %H:%M') if log.completed_at else '-',
        'duration_formatted': log.duration_formatted,
        'started_by_name': log.user.full_name if log.user else '-',
        'completed_by_name': log.completed_by_user.full_name if log.completed_by_user else None,
        'total_steps': total_steps,
        'compliant_steps': compliant,
        'non_compliant_steps': non_compliant,
        'skipped_steps': skipped,
        'compliance_rate': compliance_rate,
        'compliance_chart': compliance_chart,
        'issue_count': issues.count(),
        'step_logs': step_data,
        'issues': issue_data,
        'procedure_notes': log.notes or '',
    }

    return PDFGenerator.render_to_pdf('reports/procedure_report.html', context)


def _generate_organization_report(report):
    from apps.execution.models import ProcedureLog, StepLog
    from apps.compliance.models import NonComplianceIssue
    from .pdf_generator import PDFGenerator
    from .charts import (
        generate_status_chart,
        generate_compliance_summary_chart, generate_resolution_chart,
    )

    org = report.organization
    month = report.period_month
    year = report.period_year

    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    now = timezone.now()

    logs = ProcedureLog.objects.filter(
        organization=org,
        started_at__date__gte=start_date,
        started_at__date__lte=end_date,
    )

    total = logs.count()
    completed = logs.filter(status=ProcedureLogStatus.COMPLETED).count()
    in_progress = logs.filter(status=ProcedureLogStatus.IN_PROGRESS).count()
    cancelled = logs.filter(status=ProcedureLogStatus.CANCELLED).count()
    completion_rate = round((completed / total * 100), 1) if total > 0 else 0

    avg_duration = logs.filter(
        status=ProcedureLogStatus.COMPLETED,
    ).aggregate(avg=models.Avg('duration_minutes'))['avg'] or 0

    if avg_duration > 0:
        hours = int(avg_duration) // 60
        mins = int(avg_duration) % 60
        avg_duration_formatted = f"{hours}s {mins}dk" if hours > 0 else f"{mins}dk"
    else:
        avg_duration_formatted = "-"

    step_compliance = StepLog.objects.filter(
        procedure_log__organization=org,
        procedure_log__started_at__date__gte=start_date,
        procedure_log__started_at__date__lte=end_date,
        is_completed=True,
    ).aggregate(
        compliant=Count('id', filter=Q(completion_status='COMPLIANT')),
        non_compliant=Count('id', filter=Q(completion_status='NON_COMPLIANT')),
        skipped=Count('id', filter=Q(completion_status='SKIPPED')),
    )
    total_compliant = step_compliance['compliant'] or 0
    total_non_compliant = step_compliance['non_compliant'] or 0
    total_skipped = step_compliance['skipped'] or 0
    total_steps_checked = total_compliant + total_non_compliant + total_skipped
    compliance_rate_overall = round((total_compliant / total_steps_checked * 100), 1) if total_steps_checked > 0 else 0

    issues_opened = NonComplianceIssue.objects.filter(
        entity__organization=org,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    )
    issues_resolved = NonComplianceIssue.objects.filter(
        entity__organization=org,
        resolved_at__date__gte=start_date,
        resolved_at__date__lte=end_date,
    )

    issues_opened_count = issues_opened.count()
    issues_resolved_count = issues_resolved.count()

    issues_still_open = issues_opened.filter(
        status__in=[IssueStatus.OPEN, IssueStatus.IN_PROGRESS, IssueStatus.ESCALATED],
    ).count()

    overdue_count = issues_opened.filter(
        due_date__lt=now.date(),
    ).exclude(
        status__in=[IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED],
    ).count()

    resolved_with_dates = issues_resolved.filter(
        resolved_at__isnull=False,
    ).values_list('created_at', 'resolved_at')

    total_res_days = 0
    res_count = 0
    for created, resolved in resolved_with_dates:
        total_res_days += (resolved.date() - created.date()).days
        res_count += 1
    avg_resolution_days = round(total_res_days / res_count) if res_count > 0 else 0

    resolution_rate = round((issues_resolved_count / issues_opened_count * 100), 1) if issues_opened_count > 0 else 0

    severity_critical = issues_opened.filter(severity='CRITICAL').count()
    severity_high = issues_opened.filter(severity='HIGH').count()
    severity_medium = issues_opened.filter(severity='MEDIUM').count()
    severity_low = issues_opened.filter(severity='LOW').count()

    entity_agg = logs.values(
        ent_name=F('entity__name'),
        ent_code=F('entity__code'),
        ent_type=F('entity__entity_type'),
        ent_dept=F('entity__department__name'),
        ent_pk=F('entity__id'),
    ).annotate(
        ent_total=Count('id'),
        ent_completed=Count('id', filter=Q(status=ProcedureLogStatus.COMPLETED)),
    ).filter(ent_pk__isnull=False).order_by('-ent_total')

    issues_by_entity = dict(
        issues_opened.values('entity__id').annotate(cnt=Count('id')).values_list('entity__id', 'cnt')
    )

    entity_stats = []
    for row in entity_agg:
        et = row['ent_total']
        ec = row['ent_completed']
        entity_stats.append({
            'name': row['ent_name'],
            'code': row['ent_code'],
            'entity_type': row['ent_type'] or '-',
            'department': row['ent_dept'] or '-',
            'total': et,
            'completed': ec,
            'issues': issues_by_entity.get(row['ent_pk'], 0),
            'completion_rate': round((ec / et * 100), 1) if et > 0 else 0,
        })

    status_chart = generate_status_chart(completed, in_progress, cancelled)
    compliance_summary_chart = generate_compliance_summary_chart(total_compliant, total_non_compliant, total_skipped)
    resolution_chart = generate_resolution_chart(issues_opened_count, issues_resolved_count, issues_still_open)

    report.total_procedures = total
    report.completed_procedures = completed
    report.pending_procedures = in_progress
    report.non_compliance_count = issues_opened_count
    report.save(update_fields=['total_procedures', 'completed_procedures', 'pending_procedures', 'non_compliance_count'])

    all_issues_qs = NonComplianceIssue.objects.filter(
        entity__organization=org,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
    ).select_related(
        'entity', 'entity__department',
        'assigned_to_user', 'assigned_to_department',
        'reported_by',
    ).order_by(
        models.Case(
            models.When(severity='CRITICAL', then=0),
            models.When(severity='HIGH', then=1),
            models.When(severity='MEDIUM', then=2),
            models.When(severity='LOW', then=3),
            default=4,
            output_field=models.IntegerField(),
        ),
        '-created_at',
    )

    all_issues_data = []
    all_issues_photos = []

    for issue in all_issues_qs:
        if issue.resolved_at:
            days_open = (issue.resolved_at.date() - issue.created_at.date()).days
        else:
            days_open = (now.date() - issue.created_at.date()).days

        is_overdue = False
        if issue.due_date and issue.status not in [IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED]:
            is_overdue = now.date() > issue.due_date

        is_resolved = issue.status in [IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED]

        resolution_days = None
        if is_resolved and issue.resolved_at:
            resolution_days = (issue.resolved_at.date() - issue.created_at.date()).days

        all_issues_data.append({
            'title': issue.title,
            'severity': issue.severity,
            'status': issue.status,
            'entity_name': issue.entity.name if issue.entity else '-',
            'entity_code': issue.entity.code if issue.entity else '',
            'department_name': issue.entity.department.name if issue.entity and issue.entity.department else '-',
            'assigned_to': issue.assigned_to_user.full_name if issue.assigned_to_user else (
                issue.assigned_to_department.name if issue.assigned_to_department else '-'
            ),
            'reported_by': issue.reported_by.full_name if issue.reported_by else '-',
            'created_at': issue.created_at.strftime('%d.%m.%Y'),
            'due_date': issue.due_date.strftime('%d.%m.%Y') if issue.due_date else '-',
            'days_open': days_open,
            'is_overdue': is_overdue,
            'is_resolved': is_resolved,
            'resolution_days': resolution_days,
        })

        photos = _resolve_photos_as_base64(issue.photo_urls)
        if photos:
            all_issues_photos.append({
                'issue_number': len(all_issues_data),
                'title': issue.title,
                'severity': issue.severity,
                'entity_name': issue.entity.name if issue.entity else '-',
                'entity_code': issue.entity.code if issue.entity else '',
                'photos': photos[:6],
            })

    def _severity_pct(count):
        return round(count / issues_opened_count * 100, 1) if issues_opened_count > 0 else 0

    context = {
        'organization_name': org.name,
        'generation_date': now.strftime('%d.%m.%Y %H:%M'),
        'period': f"{month}/{year}",
        'total_procedures': total,
        'completed_procedures': completed,
        'in_progress_procedures': in_progress,
        'cancelled_procedures': cancelled,
        'completion_rate': completion_rate,
        'avg_duration_formatted': avg_duration_formatted,
        'total_compliant': total_compliant,
        'total_non_compliant': total_non_compliant,
        'total_skipped': total_skipped,
        'total_steps_checked': total_steps_checked,
        'compliance_rate_overall': compliance_rate_overall,
        'compliance_summary_chart': compliance_summary_chart,
        'resolution_chart': resolution_chart,
        'issues_opened_count': issues_opened_count,
        'issues_resolved_count': issues_resolved_count,
        'issues_still_open': issues_still_open,
        'overdue_count': overdue_count,
        'avg_resolution_days': avg_resolution_days,
        'resolution_rate': resolution_rate,
        'severity_critical': severity_critical,
        'severity_high': severity_high,
        'severity_medium': severity_medium,
        'severity_low': severity_low,
        'severity_critical_pct': _severity_pct(severity_critical),
        'severity_high_pct': _severity_pct(severity_high),
        'severity_medium_pct': _severity_pct(severity_medium),
        'severity_low_pct': _severity_pct(severity_low),
        'entity_stats': entity_stats,
        'status_chart': status_chart,
        'all_issues': all_issues_data,
        'all_issues_count': len(all_issues_data),
        'issues_with_photos': all_issues_photos,
    }

    return PDFGenerator.render_to_pdf('reports/monthly_report.html', context)


def _notify_report_ready(report):
    from apps.notifications.services import NotificationService
    from apps.authentication.models import User

    if report.generated_by_user:
        NotificationService.create_and_send(
            user=report.generated_by_user,
            notification_type=NotificationType.SYSTEM,
            title="Rapor Hazir",
            message=f'"{report.title}" raporu olusturuldu ve indirmeye hazir.',
            action_url=f"/reports/{report.id}",
            metadata={'report_id': report.id},
        )

    if report.report_type == ReportType.ORGANIZATION:
        admins = User.objects.filter(
            organization=report.organization,
            role__in=['ADMIN', 'SUPER_ADMIN'],
            is_active=True,
        )
        for admin in admins:
            if admin == report.generated_by_user:
                continue
            NotificationService.create_and_send(
                user=admin,
                notification_type=NotificationType.SYSTEM,
                title="Aylik Rapor Hazir",
                message=f'"{report.title}" raporu olusturuldu.',
                action_url=f"/reports/{report.id}",
                metadata={'report_id': report.id},
            )
