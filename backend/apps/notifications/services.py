from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from .models import Notification, PushToken, NotificationSchedule, NotificationPreference
from .push_service import ExpoService
from apps.core.constants import NotificationType


class NotificationService:
    @staticmethod
    def get_user_notifications(user, is_read=None):
        queryset = Notification.objects.filter(user=user)
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read)
        return queryset

    @staticmethod
    def mark_as_read(notification, user):
        if notification.user != user:
            from apps.core.exceptions import AuthorizationError
            raise AuthorizationError("Cannot access this notification")

        notification.mark_as_read()
        return notification

    @staticmethod
    def mark_all_as_read(user):
        Notification.objects.filter(user=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )

    @staticmethod
    @transaction.atomic
    def create_notification(user, title, message, **kwargs):
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            **kwargs
        )

    @staticmethod
    @transaction.atomic
    def create_and_send(user, notification_type, title, message, data=None, **kwargs):
        priority = kwargs.pop('priority', 'NORMAL')
        if notification_type in [
            NotificationType.PROCEDURE_OVERDUE,
            NotificationType.NON_COMPLIANCE_OVERDUE,
            NotificationType.NON_COMPLIANCE_REPORTED
        ]:
            priority = 'HIGH'

        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            priority=priority,
            is_persistent=notification_type == NotificationType.PROCEDURE_OVERDUE,
            **kwargs
        )

        push_data = data or {}
        push_data['notification_id'] = notification.id
        push_data['type'] = notification_type

        if notification.procedure_log_id:
            push_data['procedure_log_id'] = notification.procedure_log_id
            url = f"/procedures/{notification.procedure_log_id}"
            if notification.step_log_id:
                push_data['step_log_id'] = notification.step_log_id
                url += f"?focusStepId={notification.step_log_id}"
            push_data['action_url'] = url

        if notification.issue_id:
            push_data['issue_id'] = notification.issue_id
            push_data['action_url'] = f"/issues/{notification.issue_id}"

        if notification.metadata:
            push_data['metadata'] = notification.metadata

        # O-B01: Quiet Hours Implementation
        should_send_push = True
        try:
            prefs = NotificationPreference.objects.get(user=user)
            
            # 1. Check global push toggle
            if not prefs.push_enabled:
                should_send_push = False
            
            # 2. Check quiet hours (skip if urgent)
            if should_send_push and prefs.quiet_hours_enabled and priority != 'URGENT':
                if prefs.quiet_hours_start and prefs.quiet_hours_end:
                    now_time = timezone.localtime(timezone.now()).time()
                    start = prefs.quiet_hours_start
                    end = prefs.quiet_hours_end
                    
                    in_quiet_hours = False
                    if start < end:
                        in_quiet_hours = start <= now_time < end
                    else: # Overnight (e.g. 22:00 - 07:00)
                        in_quiet_hours = start <= now_time or now_time < end
                    
                    if in_quiet_hours:
                        should_send_push = False
                        
        except NotificationPreference.DoesNotExist:
            pass # Default to sending if no prefs found

        if should_send_push:
            ExpoService.send_to_user(
                user=user,
                title=title,
                body=message,
                data=push_data,
                priority='high' if priority in ['HIGH', 'URGENT'] else 'default'
            )

        return notification

    @staticmethod
    def get_or_create_schedule(
        notification_key,
        notification_type,
        target_user,
        repeat_interval_hours=24,
        procedure_log=None,
        issue=None
    ):
        schedule, created = NotificationSchedule.objects.get_or_create(
            notification_key=notification_key,
            defaults={
                'notification_type': notification_type,
                'target_user': target_user,
                'procedure_log': procedure_log,
                'issue': issue,
                'repeat_interval_hours': repeat_interval_hours,
                'next_send_at': timezone.now(),
                'is_active': True,
            }
        )
        return schedule, created

    @staticmethod
    def should_send_scheduled(schedule):
        if not schedule.is_active or schedule.target_completed:
            return False
        return timezone.now() >= schedule.next_send_at

    @staticmethod
    def mark_schedule_sent(schedule):
        now = timezone.now()
        schedule.last_sent_at = now
        schedule.send_count += 1
        schedule.next_send_at = now + timedelta(hours=schedule.repeat_interval_hours)
        schedule.save(update_fields=['last_sent_at', 'send_count', 'next_send_at'])

    @staticmethod
    def complete_schedule(notification_key):
        NotificationSchedule.objects.filter(
            notification_key=notification_key,
            is_active=True
        ).update(
            is_active=False,
            target_completed=True
        )

    @staticmethod
    def complete_schedules_for_procedure(procedure_log_id):
        NotificationSchedule.objects.filter(
            procedure_log_id=procedure_log_id,
            is_active=True
        ).update(
            is_active=False,
            target_completed=True
        )

        Notification.objects.filter(
            procedure_log_id=procedure_log_id,
            is_persistent=True
        ).update(is_persistent=False)

    @staticmethod
    def complete_schedules_for_issue(issue_id):
        NotificationSchedule.objects.filter(
            issue_id=issue_id,
            is_active=True
        ).update(
            is_active=False,
            target_completed=True
        )


    @staticmethod
    def get_last_notification_for_schedule(schedule):
        if not schedule.procedure_log and not schedule.issue:
            return None
            
        params = {
            'user': schedule.target_user,
            'type': schedule.notification_type,
        }
        if schedule.procedure_log:
            params['procedure_log'] = schedule.procedure_log
        if schedule.issue:
            params['issue'] = schedule.issue
            
        return Notification.objects.filter(**params).order_by('-created_at').first()

    @staticmethod
    def should_send_overdue_notification(schedule):
        if not schedule.is_active or schedule.target_completed:
            return False, 0
            
        if not schedule.last_sent_at:
            return True, 0

        last_notification = NotificationService.get_last_notification_for_schedule(schedule)
        
        interval_hours = 24
        
        if last_notification and not last_notification.is_read:
            interval_hours = 4
            
        if schedule.repeat_interval_hours != interval_hours:
            schedule.repeat_interval_hours = interval_hours
            schedule.save(update_fields=['repeat_interval_hours'])

        next_send_time = schedule.last_sent_at + timedelta(hours=interval_hours)
        should_send = timezone.now() >= next_send_time
        
        return should_send, interval_hours

    @staticmethod
    def process_overdue_procedures(mock_date=None, force=False):
        from apps.execution.models import ProcedureLog
        from apps.core.constants import ProcedureLogStatus, NotificationType
        from django.db.models import Max, Subquery, OuterRef

        today = mock_date if mock_date else timezone.now().date()
        sent_count = 0
        
        in_progress_overdue = ProcedureLog.objects.filter(
            status=ProcedureLogStatus.IN_PROGRESS,
            next_procedure_date__lt=today,
            user__isnull=False
        ).select_related('user', 'procedure', 'entity')

        for log in in_progress_overdue:
            NotificationService._handle_overdue_log(log, today, force, is_start_reminder=False)
            sent_count += 1

        latest_ids = ProcedureLog.objects.filter(
            procedure_id=OuterRef('procedure_id'),
            entity_id=OuterRef('entity_id')
        ).order_by('-id').values('id')[:1]

        candidate_logs = ProcedureLog.objects.filter(
            status=ProcedureLogStatus.COMPLETED,
            next_procedure_date__lt=today,
            user__isnull=False,
            id__in=Subquery(
                ProcedureLog.objects.values('procedure_id', 'entity_id').annotate(
                    latest_id=Max('id')
                ).values('latest_id')
            )
        ).select_related('user', 'procedure', 'entity')

        for log in candidate_logs:
            NotificationService._handle_overdue_log(log, today, force, is_start_reminder=True)
            sent_count += 1

        return sent_count

    @staticmethod
    def _handle_overdue_log(log, today, force, is_start_reminder):
        from apps.core.constants import NotificationType

        if not log.user:
            return
        
        notification_key = f"PROCEDURE_OVERDUE_{log.id}"
        if is_start_reminder:
            notification_key = f"PROCEDURE_START_REMINDER_{log.id}"

        schedule, created = NotificationService.get_or_create_schedule(
            notification_key=notification_key,
            notification_type=NotificationType.PROCEDURE_OVERDUE,
            target_user=log.user,
            repeat_interval_hours=4,
            procedure_log=log 
        )

        should_send, interval = NotificationService.should_send_overdue_notification(schedule)
        
        if force:
            should_send = True

        if created or should_send:
            days_overdue = (today - log.next_procedure_date).days
            
            if is_start_reminder:
                title = "Prosedür Başlangıç Gecikmesi"
                message = f"{log.procedure.title} - {log.entity.name} için yeni süreç {days_overdue} gün önce başlamalıydı."
            else:
                title = "Gecikmiş Prosedür"
                message = f"{log.procedure.title} - {log.entity.name} prosedürü {days_overdue} gündür bitirilmedi."

            if days_overdue >= 3:
                title = "🔴 " + title
            
            NotificationService.create_and_send(
                user=log.user,
                notification_type=NotificationType.PROCEDURE_OVERDUE,
                title=title,
                message=message,
                procedure_log=log,
                entity=log.entity,
                priority='URGENT',
                action_url=f"/procedures/{log.id}", 
                metadata={
                    'days_overdue': days_overdue, 
                    'procedure_log_id': log.id,
                    'is_start_reminder': is_start_reminder
                }
            )
            
            NotificationService.mark_schedule_sent(schedule)


class PushTokenService:
    @staticmethod
    def register_token(user, token, device_type=None, device_name=None):
        push_token, created = PushToken.objects.update_or_create(
            user=user,
            token=token,
            defaults={
                'device_type': device_type,
                'device_name': device_name,
                'is_active': True,
                'last_used_at': timezone.now()
            }
        )
        return push_token

    @staticmethod
    def deactivate_token(token_id, user):
        try:
            push_token = PushToken.objects.get(id=token_id, user=user)
            push_token.is_active = False
            push_token.save(update_fields=['is_active'])
        except PushToken.DoesNotExist:
            pass
