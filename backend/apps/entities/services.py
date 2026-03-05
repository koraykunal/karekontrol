from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from apps.core.exceptions import NotFoundError, ValidationError, AuthorizationError
from apps.permissions.engine import PermissionEngine
from apps.permissions.enums import PermissionKey
from apps.organizations.models import Organization
from .models import Entity, EntityImage, EntityDocument, EntityShare


class EntityService:
    @staticmethod
    def get_entities_for_user(user, include_deleted=False):
        from django.db.models import Q

        base = Entity.objects.all()
        if not include_deleted:
            base = base.filter(is_deleted=False)

        perm_qs = PermissionEngine.filter_queryset(base, user, PermissionKey.VIEW_ENTITIES)

        if not user.department_id:
            return perm_qs

        shared_subquery = EntityShare.objects.filter(
            shared_with_department_id=user.department_id,
            is_active=True,
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).values('entity_id')

        return base.filter(
            Q(id__in=perm_qs.values('id')) | Q(id__in=shared_subquery)
        )

    @staticmethod
    def get_entity_by_id(entity_id, user):
        try:
            entity = Entity.objects.get(id=entity_id, is_deleted=False)
        except Entity.DoesNotExist:
            raise NotFoundError('Entity not found')

        if not EntityService._can_access_entity(entity, user):
            raise AuthorizationError('You do not have access to this entity')

        return entity

    @staticmethod
    def get_entity_by_qr_code(qr_code, user):
        try:
            entity = Entity.objects.get(qr_code=qr_code, is_deleted=False)
        except Entity.DoesNotExist:
            raise NotFoundError('Entity not found for this QR code')

        if not EntityService._can_access_entity(entity, user):
            raise AuthorizationError('You do not have access to this entity')

        return entity

    @staticmethod
    def _can_access_entity(entity, user):
        if PermissionEngine.check(user, PermissionKey.VIEW_ENTITIES, resource=entity):
            return True

        return EntityShare.objects.filter(
            entity=entity,
            shared_with_department=user.department,
            is_active=True
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).exists()

    @staticmethod
    def check_quota(organization):
        current_count = Entity.objects.filter(organization=organization, is_deleted=False).count()
        return current_count, organization.qr_quota

    @staticmethod
    @transaction.atomic
    def create_entity(organization, department, entity_type, name, code, **kwargs):
        org = Organization.objects.select_for_update().get(id=organization.id)
        current_count = Entity.objects.filter(organization=org, is_deleted=False).count()
        qr_quota = org.qr_quota
        if qr_quota > 0 and current_count >= qr_quota:
            raise ValidationError(
                f'QR quota exceeded. Limit: {qr_quota}, current: {current_count}'
            )

        if Entity.objects.filter(organization=organization, code=code, is_deleted=False).exists():
            raise ValidationError('Entity with this code already exists in the organization')

        entity = Entity.objects.create(
            organization=organization,
            department=department,
            entity_type=entity_type,
            name=name,
            code=code,
            **kwargs
        )
        return entity

    @staticmethod
    @transaction.atomic
    def update_entity(entity, **data):
        if 'code' in data:
            existing = Entity.objects.filter(
                organization=entity.organization,
                code=data['code'],
                is_deleted=False
            ).exclude(id=entity.id).exists()
            if existing:
                raise ValidationError('Entity with this code already exists in the organization')

        allowed_fields = [
            'name', 'code', 'description', 'custom_fields', 'status', 'location',
            'serial_number', 'manufacturer', 'model', 'purchase_date',
            'warranty_expiry_date', 'notes', 'entity_type'
        ]

        for field, value in data.items():
            if field in allowed_fields and hasattr(entity, field):
                setattr(entity, field, value)

        updated_fields = [f for f in allowed_fields if f in data]
        entity.save(update_fields=updated_fields + ['updated_at'] if updated_fields else None)
        return entity

    @staticmethod
    def soft_delete_entity(entity):
        entity.soft_delete()
        return entity

    @staticmethod
    def restore_entity(entity):
        current_count, qr_quota = EntityService.check_quota(entity.organization)
        if qr_quota > 0 and current_count >= qr_quota:
            raise ValidationError(
                f'QR quota exceeded. Cannot restore. Limit: {qr_quota}, current: {current_count}'
            )
        entity.restore()
        return entity


class EntityImageService:
    @staticmethod
    @transaction.atomic
    def add_image(entity, image, caption=None, is_primary=False, order=0):
        from apps.core.file_validators import validate_file_upload
        validate_file_upload(image, 'images')
        if is_primary:
            EntityImage.objects.filter(entity=entity, is_primary=True).update(is_primary=False)

        entity_image = EntityImage.objects.create(
            entity=entity,
            image=image,
            caption=caption,
            is_primary=is_primary,
            order=order
        )
        return entity_image

    @staticmethod
    def set_primary_image(entity_image):
        EntityImage.objects.filter(entity=entity_image.entity, is_primary=True).update(is_primary=False)
        entity_image.is_primary = True
        entity_image.save(update_fields=['is_primary'])
        return entity_image

    @staticmethod
    def delete_image(entity_image):
        if entity_image.image:
            entity_image.image.delete(save=False)
        if entity_image.thumbnail:
            entity_image.thumbnail.delete(save=False)
        entity_image.delete()


class EntityDocumentService:
    @staticmethod
    def add_document(entity, file, title, document_type='other', description=None):
        from apps.core.file_validators import validate_file_upload
        validate_file_upload(file, 'documents')
        document = EntityDocument.objects.create(
            entity=entity,
            file=file,
            title=title,
            document_type=document_type,
            description=description
        )
        return document

    @staticmethod
    def delete_document(document):
        if document.file:
            document.file.delete(save=False)
        document.delete()


class EntityShareService:
    @staticmethod
    @transaction.atomic
    def share_entity(entity, shared_with_department, shared_by_user, reason=None, expires_at=None):
        if shared_with_department.organization != entity.organization:
            raise ValidationError('Cannot share with departments outside the organization')

        if shared_with_department == entity.department:
            raise ValidationError('Entity is already in this department')

        existing = EntityShare.objects.filter(
            entity=entity,
            shared_with_department=shared_with_department,
            is_active=True
        ).first()

        if existing:
            raise ValidationError('Entity is already shared with this department')

        share = EntityShare.objects.create(
            entity=entity,
            shared_with_department=shared_with_department,
            shared_by_user=shared_by_user,
            reason=reason,
            expires_at=expires_at
        )

        from apps.notifications.tasks import send_share_notification
        eid = entity.id
        ename = entity.name
        dept_id = shared_with_department.id
        uid = shared_by_user.id
        transaction.on_commit(
            lambda: send_share_notification.delay('ENTITY_SHARED', eid, ename, dept_id, uid)
        )

        return share

    @staticmethod
    def unshare_entity(share):
        share.is_active = False
        share.save(update_fields=['is_active'])
        return share
