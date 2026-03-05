import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from django.db.models import Q

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def check_overdue_procedures(self):
    from apps.notifications.services import NotificationService

    try:
        logger.info("Starting check_overdue_procedures task...")
        sent_count = NotificationService.process_overdue_procedures()
        logger.info(f"Sent {sent_count} overdue procedure notifications")
        return sent_count
    except Exception as exc:
        logger.error(f"Error in check_overdue_procedures: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def check_upcoming_procedures(self):
    from apps.execution.models import ProcedureLog
    from apps.core.constants import ProcedureLogStatus, NotificationType
    from apps.notifications.services import NotificationService
    from apps.notifications.models import NotificationPreference

    try:
        today = timezone.now().date()
        max_reminder_days = 7

        upcoming_logs = ProcedureLog.objects.filter(
            status=ProcedureLogStatus.IN_PROGRESS,
            next_procedure_date__lte=today + timedelta(days=max_reminder_days),
            next_procedure_date__gte=today,
            user__isnull=False,
            user__is_active=True
        ).select_related('procedure', 'entity', 'user')

        user_ids = upcoming_logs.values_list('user_id', flat=True).distinct()
        prefs_map = {}
        for pref in NotificationPreference.objects.filter(user_id__in=user_ids):
            prefs_map[pref.user_id] = pref

        sent_count = 0
        for log in upcoming_logs:
            pref = prefs_map.get(log.user_id)
            if pref and not pref.procedure_due_enabled:
                continue
            reminder_days = pref.reminder_days_before if pref else 3

            days_left = (log.next_procedure_date - today).days
            if days_left > reminder_days:
                continue

            notification_key = f"PROCEDURE_DUE_{log.id}_{today}"
            schedule, created = NotificationService.get_or_create_schedule(
                notification_key=notification_key,
                notification_type=NotificationType.PROCEDURE_DUE,
                target_user=log.user,
                repeat_interval_hours=24,
                procedure_log=log
            )

            if created or NotificationService.should_send_scheduled(schedule):
                NotificationService.create_and_send(
                    user=log.user,
                    notification_type=NotificationType.PROCEDURE_DUE,
                    title="Yaklaşan Prosedür",
                    message=f"{log.procedure.title} - {log.entity.name} {days_left} gün içinde tamamlanmalı.",
                    procedure_log=log,
                    entity=log.entity,
                    priority='NORMAL',
                    action_url=f"/procedures/{log.id}",
                    metadata={'days_left': days_left, 'procedure_log_id': log.id}
                )
                NotificationService.mark_schedule_sent(schedule)
                sent_count += 1

        logger.info(f"Sent {sent_count} upcoming procedure notifications")
        return sent_count
    except Exception as exc:
        logger.error(f"Error in check_upcoming_procedures: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def check_overdue_issues(self):
    from apps.compliance.models import NonComplianceIssue
    from apps.authentication.models import User
    from apps.core.constants import IssueStatus, NotificationType
    from apps.notifications.services import NotificationService
    from apps.notifications.models import NotificationPreference

    try:
        today = timezone.now().date()

        overdue_issues = NonComplianceIssue.objects.filter(
            due_date__lt=today
        ).exclude(
            status__in=[IssueStatus.RESOLVED, IssueStatus.CLOSED, IssueStatus.VERIFIED]
        ).select_related('assigned_to_user', 'assigned_to_department', 'entity')

        dept_ids = {
            issue.assigned_to_department_id
            for issue in overdue_issues
            if not issue.assigned_to_user_id and issue.assigned_to_department_id
        }
        dept_manager_map = {}
        if dept_ids:
            managers = User.objects.filter(
                department_id__in=dept_ids,
                role__in=['MANAGER', 'ADMIN'],
                is_active=True
            ).order_by('department_id')
            for mgr in managers:
                if mgr.department_id not in dept_manager_map:
                    dept_manager_map[mgr.department_id] = mgr

        user_ids = set()
        for issue in overdue_issues:
            if issue.assigned_to_user_id:
                user_ids.add(issue.assigned_to_user_id)
            elif issue.assigned_to_department_id and issue.assigned_to_department_id in dept_manager_map:
                user_ids.add(dept_manager_map[issue.assigned_to_department_id].id)
        prefs_map = {}
        for pref in NotificationPreference.objects.filter(user_id__in=user_ids):
            prefs_map[pref.user_id] = pref

        sent_count = 0
        for issue in overdue_issues:
            target_user = issue.assigned_to_user

            if not target_user and issue.assigned_to_department_id:
                target_user = dept_manager_map.get(issue.assigned_to_department_id)

            if not target_user:
                continue

            pref = prefs_map.get(target_user.id)
            if pref and not pref.issue_enabled:
                continue

            notification_key = f"ISSUE_OVERDUE_{issue.id}"

            schedule, created = NotificationService.get_or_create_schedule(
                notification_key=notification_key,
                notification_type=NotificationType.NON_COMPLIANCE_OVERDUE,
                target_user=target_user,
                repeat_interval_hours=24,
                issue=issue
            )

            if NotificationService.should_send_scheduled(schedule):
                days_overdue = (today - issue.due_date).days

                NotificationService.create_and_send(
                    user=target_user,
                    notification_type=NotificationType.NON_COMPLIANCE_OVERDUE,
                    title="Gecikmiş Uygunsuzluk",
                    message=f"{issue.title} uygunsuzluğunun son tarihi {days_overdue} gün geçti!",
                    issue=issue,
                    entity=issue.entity,
                    priority='URGENT',
                    action_url=f"/issues/{issue.id}",
                    metadata={'days_overdue': days_overdue, 'issue_id': issue.id}
                )

                NotificationService.mark_schedule_sent(schedule)
                sent_count += 1

        logger.info(f"Sent {sent_count} overdue issue notifications")
        return sent_count
    except Exception as exc:
        logger.error(f"Error in check_overdue_issues: {exc}")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def cleanup_old_notifications(self):
    from apps.notifications.models import Notification, NotificationSchedule

    ninety_days_ago = timezone.now() - timedelta(days=90)

    deleted_notifications = Notification.objects.filter(
        is_read=True,
        read_at__lt=ninety_days_ago
    ).delete()

    deleted_schedules = NotificationSchedule.objects.filter(
        is_active=False,
        target_completed=True,
        updated_at__lt=ninety_days_ago
    ).delete()

    one_eighty_days_ago = timezone.now() - timedelta(days=180)
    deleted_unread = Notification.objects.filter(
        is_read=False,
        is_persistent=False,
        created_at__lt=one_eighty_days_ago
    ).delete()

    logger.info(f"Cleaned up {deleted_notifications[0]} notifications, {deleted_unread[0]} unread, and {deleted_schedules[0]} schedules")
    return {
        'notifications_deleted': deleted_notifications[0],
        'unread_notifications_deleted': deleted_unread[0],
        'schedules_deleted': deleted_schedules[0]
    }


@shared_task(bind=True, max_retries=5, default_retry_delay=30)
def send_non_compliance_notification(self, issue_id, notification_type):
    from apps.compliance.models import NonComplianceIssue
    from apps.core.constants import NotificationType as NT
    from apps.notifications.services import NotificationService

    try:
        issue = NonComplianceIssue.objects.select_related(
            'entity', 'assigned_to_user', 'assigned_to_department', 'reported_by'
        ).get(id=issue_id)
    except NonComplianceIssue.DoesNotExist:
        logger.warning(f"send_non_compliance_notification: issue {issue_id} not found, skipping.")
        return

    if notification_type == NT.NON_COMPLIANCE_REPORTED:
        _notify_non_compliance_reported(issue, NT)

    elif notification_type == NT.NON_COMPLIANCE_ASSIGNED:
        if issue.assigned_to_user:
            NotificationService.create_and_send(
                user=issue.assigned_to_user,
                notification_type=NT.NON_COMPLIANCE_ASSIGNED,
                title="Uygunsuzluk Size Atandı",
                message=f"{issue.title} uygunsuzluğu size atandı.",
                issue=issue,
                entity=issue.entity,
                priority='HIGH',
                action_url=f"/issues/{issue.id}"
            )

    elif notification_type == NT.NON_COMPLIANCE_RESOLVED:
        if issue.reported_by and issue.reported_by != issue.resolved_by:
            NotificationService.create_and_send(
                user=issue.reported_by,
                notification_type=NT.NON_COMPLIANCE_RESOLVED,
                title="Uygunsuzluk Çözüldü",
                message=f"{issue.title} uygunsuzluğu çözüldü.",
                issue=issue,
                entity=issue.entity,
                priority='NORMAL',
                action_url=f"/issues/{issue.id}"
            )

        NotificationService.complete_schedules_for_issue(issue.id)


def _notify_non_compliance_reported(issue, NT):
    from apps.notifications.services import NotificationService
    from apps.authentication.models import User

    if issue.assigned_to_department:
        department_users = User.objects.filter(
            department=issue.assigned_to_department,
            role__in=['MANAGER', 'ADMIN'],
            is_active=True
        )
        if issue.reported_by:
            department_users = department_users.exclude(id=issue.reported_by.id)

        department_users = list(department_users)
        logger.info(
            f"Broadcasting NON_COMPLIANCE_REPORTED for issue {issue.id} "
            f"to {len(department_users)} users in Dept: {issue.assigned_to_department.name}"
        )

        if department_users:
            for user in department_users:
                try:
                    NotificationService.create_and_send(
                        user=user,
                        notification_type=NT.NON_COMPLIANCE_REPORTED,
                        title="Yeni Uygunsuzluk Bildirildi",
                        message=f"{issue.title} - {issue.entity.name}",
                        issue=issue,
                        entity=issue.entity,
                        priority='HIGH',
                        action_url=f"/issues/{issue.id}"
                    )
                except Exception as exc:
                    logger.error(
                        f"Failed to notify user {user.id} for issue {issue.id}: {exc}",
                        exc_info=True
                    )
        else:
            org = issue.entity.organization if issue.entity else None
            admins = User.objects.filter(
                organization=org,
                role__in=['ADMIN', 'SUPER_ADMIN'],
                is_active=True
            )
            logger.warning(f"Department empty for issue {issue.id}. Fallback to {admins.count()} admins.")
            for admin in admins:
                try:
                    NotificationService.create_and_send(
                        user=admin,
                        notification_type=NT.NON_COMPLIANCE_REPORTED,
                        title="Yeni Uygunsuzluk Bildirildi (Departman Boş)",
                        message=f"{issue.title} - {issue.entity.name}",
                        issue=issue,
                        entity=issue.entity,
                        priority='HIGH',
                        action_url=f"/issues/{issue.id}"
                    )
                except Exception as exc:
                    logger.error(
                        f"Failed to notify admin {admin.id} for issue {issue.id}: {exc}",
                        exc_info=True
                    )
        return

    if issue.assigned_to_user:
        NotificationService.create_and_send(
            user=issue.assigned_to_user,
            notification_type=NT.NON_COMPLIANCE_REPORTED,
            title="Yeni Uygunsuzluk Bildirildi",
            message=f"{issue.title} - {issue.entity.name}",
            issue=issue,
            entity=issue.entity,
            priority='HIGH',
            action_url=f"/issues/{issue.id}"
        )


@shared_task(bind=True, max_retries=5, default_retry_delay=30)
def send_help_request_notification(self, help_request_id, is_response=False):
    from apps.compliance.models import HelpRequest
    from apps.core.constants import NotificationType
    from apps.notifications.services import NotificationService
    from apps.notifications.models import NotificationPreference

    try:
        hr = HelpRequest.objects.select_related(
            'issue', 'to_department', 'from_department', 'requested_by', 'target_user'
        ).get(id=help_request_id)
    except HelpRequest.DoesNotExist:
        logger.warning(f"send_help_request_notification: help request {help_request_id} not found, skipping.")
        return

    def _is_help_request_enabled(user):
        try:
            pref = NotificationPreference.objects.get(user=user)
            return pref.help_request_enabled
        except NotificationPreference.DoesNotExist:
            return True

    if is_response:
        if hr.requested_by and _is_help_request_enabled(hr.requested_by):
            NotificationService.create_and_send(
                user=hr.requested_by,
                notification_type=NotificationType.HELP_REQUEST_RESPONDED,
                title="Yardım Talebiniz Yanıtlandı",
                message=f"{hr.to_department.name} departmanından yanıt aldınız.",
                entity=hr.issue.entity if hr.issue else None,
                priority='NORMAL',
                action_url=f"/issues/{hr.issue.id}" if hr.issue else None
            )
        return

    target_user = hr.target_user
    if not target_user:
        from apps.authentication.models import User
        target_user = User.objects.filter(
            department=hr.to_department,
            role__in=['MANAGER', 'ADMIN'],
            is_active=True
        ).first()

    if target_user and _is_help_request_enabled(target_user):
        NotificationService.create_and_send(
            user=target_user,
            notification_type=NotificationType.HELP_REQUEST_RECEIVED,
            title="Yardım Talebi Alındı",
            message=f"{hr.from_department.name} departmanından yardım talebi.",
            entity=hr.issue.entity if hr.issue else None,
            priority='HIGH',
            action_url=f"/issues/{hr.issue.id}" if hr.issue else None
        )


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_issue_comment_notification(self, issue_id, commenter_user_id, comment_preview):
    from apps.compliance.models import NonComplianceIssue
    from apps.core.constants import NotificationType
    from apps.notifications.services import NotificationService

    try:
        issue = NonComplianceIssue.objects.select_related(
            'reported_by', 'assigned_to_user', 'entity'
        ).get(id=issue_id)
    except NonComplianceIssue.DoesNotExist:
        return

    recipients = set()
    if issue.reported_by_id and issue.reported_by_id != commenter_user_id:
        recipients.add(issue.reported_by)
    if issue.assigned_to_user_id and issue.assigned_to_user_id != commenter_user_id:
        recipients.add(issue.assigned_to_user)

    from apps.authentication.models import User
    commenter = User.objects.filter(id=commenter_user_id).first()
    commenter_name = commenter.full_name if commenter else 'Bir kullanıcı'

    for user in recipients:
        try:
            NotificationService.create_and_send(
                user=user,
                notification_type=NotificationType.NON_COMPLIANCE_COMMENT,
                title="Uygunsuzluğa Yorum Eklendi",
                message=f"{commenter_name}: {comment_preview}",
                issue=issue,
                entity=issue.entity,
                priority='NORMAL',
                action_url=f"/issues/{issue.id}"
            )
        except Exception as exc:
            logger.error(f"Failed to send comment notification to user {user.id}: {exc}")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_issue_status_notification(self, issue_id, old_status, new_status):
    from apps.compliance.models import NonComplianceIssue
    from apps.core.constants import NotificationType
    from apps.notifications.services import NotificationService

    try:
        issue = NonComplianceIssue.objects.select_related(
            'reported_by', 'assigned_to_user', 'resolved_by', 'entity'
        ).get(id=issue_id)
    except NonComplianceIssue.DoesNotExist:
        return

    STATUS_LABELS = {
        'OPEN': 'Açık',
        'IN_PROGRESS': 'İşlemde',
        'RESOLVED': 'Çözüldü',
        'VERIFIED': 'Doğrulandı',
        'ESCALATED': 'Eskale Edildi',
        'CLOSED': 'Kapatıldı',
    }

    new_label = STATUS_LABELS.get(new_status, new_status)

    recipients = set()
    if issue.reported_by:
        recipients.add(issue.reported_by)
    if issue.assigned_to_user:
        recipients.add(issue.assigned_to_user)
    if issue.resolved_by:
        recipients.add(issue.resolved_by)

    for user in recipients:
        try:
            NotificationService.create_and_send(
                user=user,
                notification_type=NotificationType.NON_COMPLIANCE_STATUS_CHANGED,
                title="Uygunsuzluk Durumu Değişti",
                message=f"{issue.title} durumu '{new_label}' olarak güncellendi.",
                issue=issue,
                entity=issue.entity,
                priority='HIGH' if new_status == 'ESCALATED' else 'NORMAL',
                action_url=f"/issues/{issue.id}",
                metadata={'old_status': old_status, 'new_status': new_status}
            )
        except Exception as exc:
            logger.error(f"Failed to send status notification to user {user.id}: {exc}")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_share_notification(self, share_type, entity_id, item_name, department_id, shared_by_user_id):
    from apps.authentication.models import User
    from apps.core.constants import NotificationType
    from apps.notifications.services import NotificationService
    from apps.entities.models import Entity

    entity = None
    if entity_id:
        entity = Entity.objects.filter(id=entity_id).first()

    manager = User.objects.filter(
        department_id=department_id,
        role__in=['MANAGER', 'ADMIN'],
        is_active=True
    ).exclude(id=shared_by_user_id).first()

    if not manager:
        return

    shared_by = User.objects.filter(id=shared_by_user_id).first()
    shared_by_name = shared_by.full_name if shared_by else 'Bir kullanıcı'

    if share_type == 'ENTITY_SHARED':
        notification_type = NotificationType.ENTITY_SHARED
        title = "Ekipman/Varlık Paylaşıldı"
        message = f"{shared_by_name} tarafından {item_name} departmanınızla paylaşıldı."
    else:
        notification_type = NotificationType.PROCEDURE_SHARED
        title = "Prosedür Paylaşıldı"
        message = f"{shared_by_name} tarafından {item_name} prosedürü departmanınızla paylaşıldı."

    try:
        NotificationService.create_and_send(
            user=manager,
            notification_type=notification_type,
            title=title,
            message=message,
            entity=entity,
            priority='NORMAL',
            action_url=f"/entities/{entity_id}" if share_type == 'ENTITY_SHARED' and entity_id else None
        )
    except Exception as exc:
        logger.error(f"Failed to send share notification: {exc}")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_assignment_notification(self, assignment_id, is_new=True):
    from apps.permissions.models import ProcedureAssignment
    from apps.core.constants import NotificationType
    from apps.notifications.services import NotificationService

    try:
        assignment = ProcedureAssignment.objects.select_related(
            'procedure', 'assigned_to_user', 'assigned_by_user'
        ).get(id=assignment_id)
    except ProcedureAssignment.DoesNotExist:
        return

    if is_new:
        target_user = assignment.assigned_to_user
        assigner_name = assignment.assigned_by_user.full_name if assignment.assigned_by_user else 'Yönetici'
        NotificationService.create_and_send(
            user=target_user,
            notification_type=NotificationType.ASSIGNMENT_NEW,
            title="Yeni Prosedür Ataması",
            message=f"{assigner_name} tarafından {assignment.procedure.title} prosedürü size atandı.",
            priority='HIGH',
        )
    else:
        if assignment.assigned_by_user and assignment.assigned_by_user != assignment.assigned_to_user:
            STATUS_LABELS = {
                'ACCEPTED': 'kabul edildi',
                'REJECTED': 'reddedildi',
                'IN_PROGRESS': 'başlatıldı',
                'COMPLETED': 'tamamlandı',
            }
            status_label = STATUS_LABELS.get(assignment.status, assignment.status)
            user_name = assignment.assigned_to_user.full_name if assignment.assigned_to_user else 'Kullanıcı'

            NotificationService.create_and_send(
                user=assignment.assigned_by_user,
                notification_type=NotificationType.ASSIGNMENT_UPDATED,
                title="Atama Durumu Güncellendi",
                message=f"{user_name} tarafından {assignment.procedure.title} ataması {status_label}.",
                priority='NORMAL',
            )


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def send_system_notification(self, sender_user_id, title, message, priority, target,
                              department_id=None, user_ids=None, action_url=None):
    from apps.authentication.models import User
    from apps.core.constants import NotificationType
    from apps.notifications.services import NotificationService

    if target == 'all':
        sender = User.objects.filter(id=sender_user_id).first()
        if not sender:
            logger.warning(f"send_system_notification: sender {sender_user_id} not found, aborting.")
            return 0
        recipients = User.objects.filter(organization_id=sender.organization_id, is_active=True).exclude(id=sender_user_id)
    elif target == 'department':
        recipients = User.objects.filter(department_id=department_id, is_active=True)
    elif target == 'users':
        sender = User.objects.filter(id=sender_user_id).first()
        if not sender:
            return 0
        recipients = User.objects.filter(id__in=user_ids or [], is_active=True, organization_id=sender.organization_id)
    else:
        return

    sent_count = 0
    for user in recipients:
        try:
            kwargs = {}
            if action_url:
                kwargs['action_url'] = action_url
            NotificationService.create_and_send(
                user=user,
                notification_type=NotificationType.SYSTEM,
                title=title,
                message=message,
                priority=priority,
                **kwargs
            )
            sent_count += 1
        except Exception as exc:
            logger.error(f"Failed to send system notification to user {user.id}: {exc}")

    logger.info(f"Sent {sent_count} system notifications")
    return sent_count


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_step_reminders(self):
    from apps.execution.models import StepReminder
    from apps.notifications.services import NotificationService
    from apps.core.constants import NotificationType

    now = timezone.now()

    due_reminders = StepReminder.objects.filter(
        is_sent=False,
        remind_at__lte=now
    ).select_related('user', 'step_log__step', 'procedure_log__procedure', 'procedure_log__entity')

    sent_count = 0
    sent_reminders = []
    for reminder in due_reminders:
        try:
            step_title = reminder.step_log.step.title if reminder.step_log and reminder.step_log.step else "Adım"
            procedure_title = reminder.procedure_log.procedure.title if reminder.procedure_log else ""
            entity_name = reminder.procedure_log.entity.name if reminder.procedure_log and reminder.procedure_log.entity else ""

            NotificationService.create_and_send(
                user=reminder.user,
                notification_type=NotificationType.SYSTEM,
                title="Hatırlatıcı",
                message=reminder.message or f"{step_title} - {procedure_title} ({entity_name})",
                procedure_log=reminder.procedure_log,
                step_log=reminder.step_log,
                priority='HIGH',
                action_url=f"/procedures/{reminder.procedure_log.id}" if reminder.procedure_log else None,
                metadata={
                    'reminder_id': reminder.id,
                    'step_log_id': reminder.step_log.id if reminder.step_log else None
                }
            )

            reminder.is_sent = True
            reminder.sent_at = now
            sent_reminders.append(reminder)
            sent_count += 1
        except Exception as exc:
            logger.error(f"Failed to send step reminder {reminder.id}: {exc}", exc_info=True)

    if sent_reminders:
        StepReminder.objects.bulk_update(sent_reminders, ['is_sent', 'sent_at'])

    logger.info(f"Sent {sent_count} step reminders")
    return sent_count
