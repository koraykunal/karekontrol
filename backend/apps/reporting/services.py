from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from .models import Report, ReportDistribution, ReportSchedule
from apps.core.constants import ReportStatus, ReportTriggerType


class ReportingService:
    @staticmethod
    def get_reports_for_user(user):
        if user.role == 'SUPER_ADMIN':
            return Report.objects.all()
        if user.role == 'ADMIN':
            return Report.objects.filter(organization=user.organization)

        if user.role == 'MANAGER':
            return Report.objects.filter(
                Q(department=user.department) |
                Q(distributions__user=user) |
                Q(generated_by_user=user)
            ).distinct()

        return Report.objects.filter(
            Q(distributions__user=user) |
            Q(generated_by_user=user)
        ).distinct()

    @staticmethod
    @transaction.atomic
    def create_report_request(user, organization, **data):
        report = Report.objects.create(
            organization=organization,
            generated_by_user=user,
            triggered_by=ReportTriggerType.MANUAL,
            status=ReportStatus.PENDING,
            **data
        )
        from .tasks import generate_report_task
        transaction.on_commit(lambda: generate_report_task.delay(report.id))
        return report

    @staticmethod
    def distribute_report(report, user, method='PORTAL'):
        return ReportDistribution.objects.create(
            report=report,
            user=user,
            delivery_method=method,
            status='SENT'
        )

    @staticmethod
    def mark_downloaded(report, user):
        distribution = ReportDistribution.objects.filter(
            report=report,
            user=user
        ).first()

        if distribution:
            distribution.download_count += 1
            distribution.last_downloaded_at = timezone.now()
            distribution.save(update_fields=['download_count', 'last_downloaded_at'])
            return True
        return False

    @staticmethod
    def get_user_schedules(user):
        if user.role == 'SUPER_ADMIN':
            return ReportSchedule.objects.all()
        if user.role == 'ADMIN':
            return ReportSchedule.objects.filter(organization=user.organization)
        if user.role == 'MANAGER':
            return ReportSchedule.objects.filter(department=user.department)
        return ReportSchedule.objects.none()

    @staticmethod
    def create_schedule(user, **data):
        return ReportSchedule.objects.create(
            organization=user.organization,
            **data
        )
