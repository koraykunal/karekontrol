from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from django.core.files.storage import default_storage
from .models import Entity, EntityImage, EntityDocument


@receiver(post_delete, sender=EntityImage)
def delete_entity_image_files(sender, instance, **kwargs):
    if instance.image and instance.image.name:
        if default_storage.exists(instance.image.name):
            default_storage.delete(instance.image.name)

    if instance.thumbnail and instance.thumbnail.name:
        if default_storage.exists(instance.thumbnail.name):
            default_storage.delete(instance.thumbnail.name)


@receiver(post_delete, sender=EntityDocument)
def delete_entity_document_files(sender, instance, **kwargs):
    if instance.file and instance.file.name:
        if default_storage.exists(instance.file.name):
            default_storage.delete(instance.file.name)


@receiver(post_delete, sender=Entity)
def delete_entity_qr_image(sender, instance, **kwargs):
    if instance.qr_image and instance.qr_image.name:
        if default_storage.exists(instance.qr_image.name):
            default_storage.delete(instance.qr_image.name)
