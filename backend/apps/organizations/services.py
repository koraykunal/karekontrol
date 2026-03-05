import logging
import secrets
import string

from django.db import transaction
from apps.core.exceptions import NotFoundError, ValidationError, AuthorizationError
from .models import Organization, Department

logger = logging.getLogger(__name__)


class OrganizationService:
    @staticmethod
    def get_all_organizations(user):
        if user.role == 'SUPER_ADMIN':
            return Organization.objects.all()
        return Organization.objects.filter(id=user.organization_id)

    @staticmethod
    def get_organization_by_id(organization_id, user):
        try:
            organization = Organization.objects.get(id=organization_id)
        except Organization.DoesNotExist:
            raise NotFoundError('Organization not found')

        if user.role != 'SUPER_ADMIN' and organization.id != user.organization_id:
            raise AuthorizationError('You do not have access to this organization')

        return organization

    @staticmethod
    @transaction.atomic
    def create_organization(name, company_number, description=None, contact_email=None,
                            contact_phone=None, address=None, registration_number=None, qr_quota=0):
        if Organization.objects.filter(name=name).exists():
            raise ValidationError('Organization with this name already exists')
        if Organization.objects.filter(company_number=company_number).exists():
            raise ValidationError('Organization with this company number already exists')

        organization = Organization.objects.create(
            name=name,
            company_number=company_number,
            registration_number=registration_number,
            qr_quota=qr_quota,
            description=description,
            contact_email=contact_email,
            contact_phone=contact_phone,
            address=address,
        )
        return organization

    @staticmethod
    @transaction.atomic
    def update_organization(organization, **data):
        if 'name' in data:
            existing = Organization.objects.filter(name=data['name']).exclude(id=organization.id).exists()
            if existing:
                raise ValidationError('Organization with this name already exists')

        if 'company_number' in data:
            existing = Organization.objects.filter(company_number=data['company_number']).exclude(id=organization.id).exists()
            if existing:
                raise ValidationError('Organization with this company number already exists')

        allowed_fields = [
            'name', 'company_number', 'registration_number', 'qr_quota',
            'description', 'contact_email', 'contact_phone', 'address', 'logo_url', 'is_active',
        ]

        for field, value in data.items():
            if field in allowed_fields and hasattr(organization, field):
                setattr(organization, field, value)

        organization.save()
        return organization

    @staticmethod
    def activate_organization(organization):
        organization.is_active = True
        organization.save(update_fields=['is_active'])
        return organization

    @staticmethod
    def deactivate_organization(organization):
        organization.is_active = False
        organization.save(update_fields=['is_active'])
        return organization

    @staticmethod
    @transaction.atomic
    def onboard_organization(org_data, admin_data):
        """Create organization + admin user in a single transaction."""
        from apps.authentication.models import User
        from apps.core.constants import UserRole

        organization = Organization.objects.create(
            name=org_data['name'],
            company_number=org_data['company_number'],
            registration_number=org_data.get('registration_number') or None,
            qr_quota=org_data.get('qr_quota', 0),
            description=org_data.get('description') or None,
            contact_email=org_data.get('contact_email') or None,
            contact_phone=org_data.get('contact_phone') or None,
            address=org_data.get('address') or None,
        )

        plain_password = admin_data.get('admin_password') or None
        if not plain_password:
            alphabet = string.ascii_letters + string.digits + '!@#$%'
            plain_password = ''.join(secrets.choice(alphabet) for _ in range(12))

        admin_user = User.objects.create_user(
            email=admin_data['admin_email'],
            password=plain_password,
            full_name=admin_data['admin_full_name'],
            phone=admin_data.get('admin_phone') or None,
            role=UserRole.ADMIN,
            organization=organization,
        )

        return organization, admin_user, plain_password

    @staticmethod
    @transaction.atomic
    def reset_sandbox_organization(org_id, password):
        from django.core.files.storage import default_storage
        from apps.compliance.models import NonComplianceIssue
        from apps.execution.models import StepLog, ProcedureLog
        from .sandbox import seed_sandbox_organization

        try:
            org = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            raise NotFoundError('Organization not found')

        if not org.is_sandbox:
            raise ValidationError('Sadece sandbox organizasyonlar sıfırlanabilir')

        _cleanup_orphan_media(org)

        org_snapshot = {
            'name': org.name,
            'company_number': org.company_number,
            'registration_number': org.registration_number,
            'qr_quota': org.qr_quota,
            'description': org.description,
            'contact_email': org.contact_email,
            'contact_phone': org.contact_phone,
            'address': org.address,
        }

        org.delete()

        new_org = Organization.objects.create(
            is_active=True,
            is_sandbox=True,
            **org_snapshot,
        )

        result = seed_sandbox_organization(new_org, password)
        logger.info('Sandbox organization reset: %s (id=%d)', new_org.name, new_org.id)
        return result


def _cleanup_orphan_media(org):
    from django.core.files.storage import default_storage
    from apps.compliance.models import NonComplianceIssue
    from apps.execution.models import StepLog, ProcedureLog

    for issue in NonComplianceIssue.objects.filter(entity__organization=org):
        for url in (issue.photo_urls or []) + (issue.resolution_photo_urls or []):
            try:
                if url and default_storage.exists(url):
                    default_storage.delete(url)
            except Exception:
                logger.warning('Failed to delete orphan media: %s', url)

    log_ids = ProcedureLog.objects.filter(organization=org).values_list('id', flat=True)
    for step_log in StepLog.objects.filter(procedure_log_id__in=log_ids):
        for url in (step_log.photo_urls or []):
            try:
                if url and default_storage.exists(url):
                    default_storage.delete(url)
            except Exception:
                logger.warning('Failed to delete orphan media: %s', url)


class DepartmentService:
    @staticmethod
    def get_departments_for_user(user):
        if user.role == 'SUPER_ADMIN':
            return Department.objects.all()
        if user.role == 'ADMIN':
            return Department.objects.filter(organization=user.organization)
        if user.role == 'MANAGER':
            return Department.objects.filter(organization=user.organization)
        return Department.objects.filter(id=user.department_id)

    @staticmethod
    def get_department_by_id(department_id, user):
        try:
            department = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            raise NotFoundError('Department not found')

        if user.role == 'SUPER_ADMIN':
            return department

        if department.organization_id != user.organization_id:
            raise AuthorizationError('You do not have access to this department')

        return department

    @staticmethod
    @transaction.atomic
    def create_department(organization, name, description=None, code=None, manager=None):
        """Create a new department"""
        if Department.objects.filter(organization=organization, name=name).exists():
            raise ValidationError('Department with this name already exists in the organization')

        department = Department.objects.create(
            organization=organization,
            name=name,
            description=description,
            code=code,
            manager=manager
        )
        return department

    @staticmethod
    @transaction.atomic
    def update_department(department, **data):
        """Update department details"""
        if 'name' in data:
            existing = Department.objects.filter(
                organization=department.organization,
                name=data['name']
            ).exclude(id=department.id).exists()
            if existing:
                raise ValidationError('Department with this name already exists in the organization')

        allowed_fields = ['name', 'description', 'is_active']

        for field, value in data.items():
            if field in allowed_fields and hasattr(department, field):
                setattr(department, field, value)

        department.save()
        return department

    @staticmethod
    def assign_manager(department, manager):
        """Assign a manager to a department"""
        if manager and manager.organization_id != department.organization_id:
            raise ValidationError('Manager must belong to the same organization')

        department.manager = manager
        department.save(update_fields=['manager'])
        return department

    @staticmethod
    def delete_department(department):
        """Delete a department"""
        if department.users.exists():
            raise ValidationError('Cannot delete department with active users')
        department.delete()
