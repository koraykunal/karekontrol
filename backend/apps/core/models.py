import logging

from django.core.files.storage import default_storage
from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


class TimestampMixin(models.Model):
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        self._cleanup_related_files()
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])

    def _cleanup_related_files(self):
        for field in self._meta.get_fields():
            if isinstance(field, (models.FileField, models.ImageField)):
                file_field = getattr(self, field.name)
                if file_field and file_field.name:
                    self._delete_storage_file(file_field.name)

        for relation in self._meta.related_objects:
            if relation.on_delete != models.CASCADE:
                continue
            related_model = relation.related_model
            file_fields = [
                f for f in related_model._meta.get_fields()
                if isinstance(f, (models.FileField, models.ImageField))
            ]
            if not file_fields:
                continue

            accessor_name = relation.get_accessor_name()
            related_qs = getattr(self, accessor_name).all()
            for obj in related_qs:
                for ff in file_fields:
                    file_field = getattr(obj, ff.name)
                    if file_field and file_field.name:
                        self._delete_storage_file(file_field.name)

    @staticmethod
    def _delete_storage_file(name):
        try:
            if default_storage.exists(name):
                default_storage.delete(name)
        except Exception:
            logger.warning("Failed to delete file: %s", name, exc_info=True)
