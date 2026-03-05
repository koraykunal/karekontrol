from django.utils import timezone
from django.db import transaction
from apps.core.exceptions import NotFoundError, ValidationError, AuthorizationError
from apps.core.constants import ProcedureLogStatus
from .models import ProcedureLog, StepLog, ProcedureShare, StepReminder
from apps.procedures.models import ProcedureStep


class ExecutionService:
    @staticmethod
    def get_logs_for_user(user):
        from apps.permissions.engine import PermissionEngine
        from apps.permissions.enums import PermissionKey
        from django.db.models import Q

        queryset = ProcedureLog.objects.all()
        queryset = PermissionEngine.filter_queryset(queryset, user, PermissionKey.VIEW_EXECUTIONS)

        permissions = PermissionEngine.get_user_permissions(user)
        perm_config = permissions.get(PermissionKey.VIEW_EXECUTIONS, {})
        scope = perm_config.get('scope')

        if scope == 'DEPARTMENT':
            shared_ids = ProcedureShare.objects.filter(
                shared_with_department=user.department,
                is_active=True
            ).values_list('procedure_log_id', flat=True)
            if shared_ids:
                shared = ProcedureLog.objects.filter(id__in=shared_ids)
                return queryset | shared

        return queryset

    @staticmethod
    @transaction.atomic
    def start_procedure(procedure, entity, user, notes=None, next_procedure_date=None):
        """Start a new procedure execution"""
        
        existing_log = ProcedureLog.objects.select_for_update().filter(
            organization=procedure.organization,
            entity=entity,
            procedure=procedure,
            user=user,
            status=ProcedureLogStatus.IN_PROGRESS
        ).first()

        if existing_log:
            return existing_log

        log = ProcedureLog.objects.create(
            organization=procedure.organization,
            entity=entity,
            procedure=procedure,
            user=user,
            notes=notes,
            next_procedure_date=next_procedure_date,
            status=ProcedureLogStatus.IN_PROGRESS,
            started_at=timezone.now()
        )

        # Create logs for each step
        steps = procedure.steps.all().order_by('step_order')
        step_logs = []
        for step in steps:
            step_logs.append(StepLog(
                procedure_log=log,
                step=step
            ))

        StepLog.objects.bulk_create(step_logs)

        from apps.notifications.services import NotificationService
        old_log_ids = ProcedureLog.objects.filter(
            entity=entity,
            procedure=procedure,
            status=ProcedureLogStatus.COMPLETED
        ).exclude(id=log.id).values_list('id', flat=True)
        for old_id in old_log_ids:
            NotificationService.complete_schedules_for_procedure(old_id)

        return log

    @staticmethod
    @transaction.atomic
    def complete_step(step_log, user, **data):
        """Mark a step as completed"""
        step_log.is_completed = True
        step_log.completed_by_user = user
        step_log.completed_at = timezone.now()
        
        # Update fields
        # Update fields - Whitelist allowed fields (Y-B03 Mass Assignment Fix)
        allowed_fields = [
            'completion_status', 'notes', 'photo_urls', 
            'checklist_results', 'is_compliant', 'duration_minutes'
        ]
        
        for field, value in data.items():
            if field in allowed_fields and hasattr(step_log, field):
                setattr(step_log, field, value)
        
        step_log.save()
        
        # Create NonComplianceIssue if step is marked as NON_COMPLIANT
        completion_status = data.get('completion_status', '')
        if completion_status == 'NON_COMPLIANT':
            from apps.compliance.models import NonComplianceIssue
            from apps.core.constants import IssueSeverity
            
            severity_map = {
                'LOW': IssueSeverity.LOW,
                'MEDIUM': IssueSeverity.MEDIUM,
                'HIGH': IssueSeverity.HIGH,
                'CRITICAL': IssueSeverity.CRITICAL,
            }
            raw_severity = (data.get('severity', 'MEDIUM') or 'MEDIUM').upper()
            severity = severity_map.get(raw_severity, IssueSeverity.MEDIUM)
            
            # Create the issue linked to this step
            issue = NonComplianceIssue.objects.create(
                entity=step_log.procedure_log.entity,
                procedure_log=step_log.procedure_log,
                step_log=step_log,
                title=step_log.step.title if step_log.step else 'Uygunsuzluk',
                description=data.get('notes', '') or 'Adımda uygunsuzluk tespit edildi.',
                severity=severity,
                photo_urls=data.get('photo_urls', []) or [],
                reported_by=user,
                assigned_to_department=step_log.procedure_log.entity.department if step_log.procedure_log.entity else None,
            )

            # Send notification immediately
            # Send notification after transaction commit
            from apps.notifications.tasks import send_non_compliance_notification
            from apps.core.constants import NotificationType
            
            transaction.on_commit(
                lambda: send_non_compliance_notification.delay(issue.id, NotificationType.NON_COMPLIANCE_REPORTED)
            )
        
        # Update parent procedure log progress
        ExecutionService._update_procedure_progress(step_log.procedure_log)
        
        return step_log

    @staticmethod
    def _update_procedure_progress(procedure_log):
        """Recalculate completion percentage"""
        total_steps = procedure_log.step_logs.count()
        if total_steps == 0:
            procedure_log.completion_percentage = 100
        else:
            completed = procedure_log.step_logs.filter(is_completed=True).count()
            procedure_log.completion_percentage = int((completed / total_steps) * 100)

        procedure_log.save(update_fields=['completion_percentage'])

    @staticmethod
    @transaction.atomic
    def skip_step(step_log, user, notes='Step skipped'):
        """Mark a step as skipped"""
        step_log.notes = notes
        step_log.completion_status = 'SKIPPED'
        step_log.is_completed = True
        step_log.completed_at = timezone.now()
        step_log.completed_by_user = user
        step_log.save()

        ExecutionService._update_procedure_progress(step_log.procedure_log)

        return step_log

    @staticmethod
    @transaction.atomic
    def complete_procedure(procedure_log, user):
        if procedure_log.step_logs.filter(is_completed=False).exists():
            raise ValidationError("Cannot complete procedure with incomplete steps")

        procedure_log.status = ProcedureLogStatus.COMPLETED
        procedure_log.completed_by_user = user
        procedure_log.completed_at = timezone.now()

        if procedure_log.completed_at and procedure_log.started_at:
            delta = procedure_log.completed_at - procedure_log.started_at
            procedure_log.duration_minutes = int(delta.total_seconds() / 60)

        if procedure_log.procedure.interval_value:
            from apps.core.utils import calculate_next_procedure_date
            procedure_log.next_procedure_date = calculate_next_procedure_date(
                procedure_log.procedure.interval_value,
                procedure_log.procedure.interval_unit
            )

        procedure_log.save()

        from apps.notifications.services import NotificationService
        NotificationService.complete_schedules_for_procedure(procedure_log.id)

        return procedure_log

    @staticmethod
    @transaction.atomic
    def cancel_procedure(procedure_log, user, notes='Prosedür iptal edildi'):
        procedure_log.status = ProcedureLogStatus.CANCELLED
        procedure_log.notes = notes
        procedure_log.completed_at = timezone.now()
        procedure_log.completed_by_user = user
        procedure_log.save(update_fields=['status', 'notes', 'completed_at', 'completed_by_user'])

        from apps.notifications.services import NotificationService
        NotificationService.complete_schedules_for_procedure(procedure_log.id)

        return procedure_log

    @staticmethod
    @transaction.atomic
    def share_log(procedure_log, department, user, reason=None):
        """Share a procedure log with another department"""
        share = ProcedureShare.objects.create(
            procedure_log=procedure_log,
            shared_with_department=department,
            shared_by_user=user,
            reason=reason
        )

        from apps.notifications.tasks import send_share_notification
        entity = procedure_log.entity
        entity_id = entity.id if entity else None
        proc_title = procedure_log.procedure.title if procedure_log.procedure else 'Prosedür'
        dept_id = department.id
        user_id = user.id
        transaction.on_commit(
            lambda: send_share_notification.delay(
                'PROCEDURE_SHARED', entity_id, proc_title, dept_id, user_id
            )
        )

        return share
