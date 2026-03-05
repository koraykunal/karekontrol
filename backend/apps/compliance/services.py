from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from apps.core.exceptions import AuthorizationError, ValidationError
from apps.core.constants import IssueStatus
from apps.permissions.engine import PermissionEngine
from apps.permissions.enums import PermissionKey
from .models import NonComplianceIssue, IssueComment, HelpRequest


class ComplianceService:
    @staticmethod
    def get_issues_for_user(user):
        queryset = NonComplianceIssue.objects.select_related(
            'entity',
            'procedure_log__procedure',
            'step_log__step',
            'reported_by',
            'resolved_by',
            'assigned_to_department',
            'assigned_to_user',
        ).prefetch_related('comments__user')

        permissions = PermissionEngine.get_user_permissions(user)
        perm_config = permissions.get(PermissionKey.VIEW_ISSUES, {})

        if not perm_config.get('enabled', False):
            return queryset.none()

        scope = perm_config.get('scope')

        if not scope or scope == 'ALL':
            return queryset

        if scope == 'ORGANIZATION':
            return queryset.filter(entity__organization_id=user.organization_id)

        if scope == 'DEPARTMENT':
            return queryset.filter(
                Q(entity__department_id=user.department_id) |
                Q(assigned_to_department_id=user.department_id)
            )

        if scope == 'OWN':
            return queryset.filter(
                Q(assigned_to_user_id=user.id) |
                Q(reported_by_id=user.id)
            )

        return queryset

    @staticmethod
    @transaction.atomic
    def report_issue(user, entity, title, description, **kwargs):
        allowed_kwargs = {}
        for key in ['severity', 'category', 'tags', 'photo_urls', 'due_date',
                    'assigned_to_department', 'assigned_to_user', 'procedure_log', 'step_log']:
            if key in kwargs:
                allowed_kwargs[key] = kwargs[key]

        issue = NonComplianceIssue.objects.create(
            entity=entity,
            reported_by=user,
            title=title,
            description=description,
            status=IssueStatus.OPEN,
            **allowed_kwargs
        )
        
        from apps.notifications.tasks import send_non_compliance_notification
        from apps.core.constants import NotificationType
        transaction.on_commit(
            lambda: send_non_compliance_notification.delay(issue.id, NotificationType.NON_COMPLIANCE_REPORTED)
        )
        
        return issue

    @staticmethod
    @transaction.atomic
    def update_issue(issue, **data):
        old_assigned_to_user_id = issue.assigned_to_user_id
        old_status = issue.status

        allowed_fields = [
            'title', 'description', 'severity', 'status',
            'resolution_photo_urls', 'resolved_notes',
            'assigned_to_department', 'assigned_to_user',
            'due_date', 'category', 'tags',
            'photo_urls'
        ]

        for field, value in data.items():
            if field in allowed_fields and hasattr(issue, field):
                setattr(issue, field, value)

        updated_fields = [f for f in allowed_fields if f in data]
        issue.save(update_fields=updated_fields + ['updated_at'] if updated_fields else None)

        from apps.notifications.tasks import send_non_compliance_notification, send_issue_status_notification
        from apps.core.constants import NotificationType

        new_assigned_to_user_id = issue.assigned_to_user_id
        if new_assigned_to_user_id and new_assigned_to_user_id != old_assigned_to_user_id:
            issue_id = issue.id
            transaction.on_commit(
                lambda: send_non_compliance_notification.delay(issue_id, NotificationType.NON_COMPLIANCE_ASSIGNED)
            )

        new_status = issue.status
        if new_status != old_status:
            issue_id = issue.id
            _old = old_status
            _new = new_status
            transaction.on_commit(
                lambda: send_issue_status_notification.delay(issue_id, _old, _new)
            )

        return issue

    @staticmethod
    def _save_file(file_obj, organization_context_obj=None):
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        from apps.core.utils import get_organization_upload_path
        
        class DummyInstance:
            pass
            
        instance = DummyInstance()
        if organization_context_obj:
            if hasattr(organization_context_obj, 'entity'):
                instance.entity = organization_context_obj.entity
            elif hasattr(organization_context_obj, 'organization'):
                instance.organization = organization_context_obj.organization
            else:
                 instance.organization_id = getattr(organization_context_obj, 'organization_id', None)
        
        path = get_organization_upload_path(instance, file_obj.name)
        
        saved_path = default_storage.save(path, ContentFile(file_obj.read()))
        return default_storage.url(saved_path)

    @staticmethod
    @transaction.atomic
    def resolve_issue(issue, user, resolution_notes, resolution_photos=None):
        issue.status = IssueStatus.RESOLVED
        issue.resolved_by = user
        issue.resolved_at = timezone.now()
        issue.resolved_notes = resolution_notes
        
        if resolution_photos:
            photo_urls = []
            for photo in resolution_photos:
                if hasattr(photo, 'read'):
                    url = ComplianceService._save_file(photo, issue)
                    photo_urls.append(url)
                elif isinstance(photo, str):
                    photo_urls.append(photo)
            
            issue.resolution_photo_urls = photo_urls
        
        issue.save()

        from apps.notifications.tasks import send_non_compliance_notification
        from apps.core.constants import NotificationType
        transaction.on_commit(
            lambda: send_non_compliance_notification.delay(issue.id, NotificationType.NON_COMPLIANCE_RESOLVED)
        )

        return issue

    @staticmethod
    @transaction.atomic
    def add_comment(issue, user, content, attachments=None, is_internal=False):
        comment = IssueComment.objects.create(
            issue=issue,
            user=user,
            content=content,
            attachments=attachments or [],
            is_internal=is_internal
        )

        if not is_internal:
            from apps.notifications.tasks import send_issue_comment_notification
            transaction.on_commit(
                lambda: send_issue_comment_notification.delay(issue.id, user.id, content[:100])
            )

        return comment

    @staticmethod
    def create_help_request(issue, user, to_department, message, target_user=None):
        hr = HelpRequest.objects.create(
            issue=issue,
            from_department=user.department,
            to_department=to_department,
            requested_by=user,
            target_user=target_user,
            message=message,
            status='PENDING'
        )
        
        from apps.notifications.tasks import send_help_request_notification
        send_help_request_notification.delay(hr.id, is_response=False)
        
        return hr

    @staticmethod
    def respond_to_help_request(help_request, user, status, response_message=None):
        help_request.status = status
        help_request.responded_by = user
        help_request.response_message = response_message
        help_request.responded_at = timezone.now()
        help_request.save(update_fields=['status', 'responded_by', 'response_message', 'responded_at'])
        
        from apps.notifications.tasks import send_help_request_notification
        send_help_request_notification.delay(help_request.id, is_response=True)
        
        return help_request
