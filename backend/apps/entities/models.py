import os
import uuid
import qrcode
from io import BytesIO
from django.db import models
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from PIL import Image as PILImage
from apps.core.models import TimestampMixin, SoftDeleteMixin
from apps.core.utils import get_organization_upload_path


def validate_image_size(image):
    file_size = image.size
    limit_mb = 10
    if file_size > limit_mb * 1024 * 1024:
        raise ValidationError(f'Image size should not exceed {limit_mb}MB')


def validate_image_extension(image):
    valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.heif']
    _, ext = os.path.splitext(image.name)
    if ext.lower() not in valid_extensions:
        raise ValidationError(f'Invalid image extension. Allowed: {", ".join(valid_extensions)}')


def validate_document_extension(file):
    valid_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
    _, ext = os.path.splitext(file.name)
    if ext.lower() not in valid_extensions:
        raise ValidationError(f'Invalid file type. Allowed: {", ".join(valid_extensions)}')


class Entity(TimestampMixin, SoftDeleteMixin):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='entities'
    )
    department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.CASCADE,
        related_name='entities'
    )
    entity_type = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=100)
    qr_code = models.CharField(max_length=255, unique=True, db_index=True, blank=True)
    qr_image = models.ImageField(upload_to=get_organization_upload_path, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=50, default='ACTIVE', db_index=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    manufacturer = models.CharField(max_length=200, blank=True, null=True)
    model = models.CharField(max_length=200, blank=True, null=True)
    purchase_date = models.DateField(blank=True, null=True)
    warranty_expiry_date = models.DateField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'entities'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'code'],
                name='unique_org_entity_code'
            )
        ]
        indexes = [
            models.Index(fields=['qr_code']),
            models.Index(fields=['entity_type']),
            models.Index(fields=['organization', 'department']),
            models.Index(fields=['status']),
        ]
        verbose_name = 'Entity'
        verbose_name_plural = 'Entities'

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        if not self.qr_code:
            self.qr_code = self.generate_qr_code()

        if not self.qr_image:
            self.generate_qr_image()

        super().save(*args, **kwargs)

    def generate_qr_code(self):
        for _ in range(10):
            code = f"ENT-{uuid.uuid4().hex[:12].upper()}"
            if not Entity.objects.filter(qr_code=code).exists():
                return code
        raise ValueError("Could not generate unique QR code after 10 attempts")

    def generate_qr_image(self):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(self.qr_code)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        filename = f"qr_{self.qr_code}.png"
        self.qr_image.save(filename, ContentFile(buffer.read()), save=False)


class EntityImage(TimestampMixin):
    entity = models.ForeignKey(
        Entity,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to=get_organization_upload_path,
        validators=[validate_image_size, validate_image_extension]
    )
    thumbnail = models.ImageField(upload_to=get_organization_upload_path, blank=True, null=True)
    caption = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'entity_images'
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['entity', 'is_primary']),
            models.Index(fields=['entity', 'order']),
        ]
        verbose_name = 'Entity Image'
        verbose_name_plural = 'Entity Images'

    def __str__(self):
        return f"Image for {self.entity.name}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            from django.db import transaction
            with transaction.atomic():
                EntityImage.objects.select_for_update().filter(
                    entity=self.entity, is_primary=True
                ).update(is_primary=False)

        if self.image and not self.thumbnail:
            self.create_thumbnail()

        super().save(*args, **kwargs)

    def create_thumbnail(self):
        if not self.image:
            return

        img = PILImage.open(self.image)
        img.thumbnail((300, 300), PILImage.Resampling.LANCZOS)

        thumb_io = BytesIO()
        img.save(thumb_io, format='JPEG', quality=85)
        thumb_io.seek(0)

        filename = f"thumb_{self.image.name.split('/')[-1]}"
        self.thumbnail.save(filename, ContentFile(thumb_io.read()), save=False)


class EntityDocument(TimestampMixin):
    entity = models.ForeignKey(
        Entity,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    file = models.FileField(upload_to=get_organization_upload_path, validators=[validate_document_extension])
    title = models.CharField(max_length=255)
    document_type = models.CharField(
        max_length=50,
        choices=[
            ('MANUAL', 'Manual'),
            ('CERTIFICATE', 'Certificate'),
            ('WARRANTY', 'Warranty'),
            ('INVOICE', 'Invoice'),
            ('OTHER', 'Other')
        ],
        default='OTHER'
    )
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'entity_documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity', 'document_type']),
        ]
        verbose_name = 'Entity Document'
        verbose_name_plural = 'Entity Documents'

    def __str__(self):
        return f"{self.title} - {self.entity.name}"


class EntityShare(TimestampMixin):
    entity = models.ForeignKey(
        Entity,
        on_delete=models.CASCADE,
        related_name='shares'
    )
    shared_with_department = models.ForeignKey(
        'organizations.Department',
        on_delete=models.CASCADE,
        related_name='shared_entities'
    )
    shared_by_user = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='entity_shares_created'
    )
    reason = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'entity_shares'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['entity', 'shared_with_department'],
                condition=models.Q(is_active=True),
                name='unique_active_entity_share'
            )
        ]
        indexes = [
            models.Index(fields=['entity', 'is_active']),
            models.Index(fields=['shared_with_department', 'is_active']),
        ]
        verbose_name = 'Entity Share'
        verbose_name_plural = 'Entity Shares'

    def __str__(self):
        return f"{self.entity.name} shared with {self.shared_with_department.name}"
