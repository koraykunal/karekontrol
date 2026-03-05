from django.contrib import admin
from .models import Entity, EntityImage, EntityDocument, EntityShare


class EntityImageInline(admin.TabularInline):
    model = EntityImage
    extra = 1
    fields = ['image', 'thumbnail', 'caption', 'is_primary', 'order']
    readonly_fields = ['thumbnail']


class EntityDocumentInline(admin.TabularInline):
    model = EntityDocument
    extra = 1
    fields = ['title', 'file', 'document_type', 'description']


@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'entity_type', 'organization', 'department', 'status', 'created_at']
    list_filter = ['entity_type', 'status', 'organization', 'department', 'is_deleted']
    search_fields = ['name', 'code', 'qr_code', 'serial_number']
    readonly_fields = ['qr_code', 'qr_image', 'created_at', 'updated_at']
    inlines = [EntityImageInline, EntityDocumentInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('organization', 'department', 'entity_type', 'name', 'code', 'status')
        }),
        ('QR Code', {
            'fields': ('qr_code', 'qr_image')
        }),
        ('Details', {
            'fields': ('description', 'location', 'serial_number', 'manufacturer', 'model')
        }),
        ('Purchase Information', {
            'fields': ('purchase_date', 'warranty_expiry_date')
        }),
        ('Additional', {
            'fields': ('custom_fields', 'notes')
        }),
        ('Status', {
            'fields': ('is_deleted', 'deleted_at', 'created_at', 'updated_at')
        }),
    )


@admin.register(EntityImage)
class EntityImageAdmin(admin.ModelAdmin):
    list_display = ['entity', 'caption', 'is_primary', 'order', 'created_at']
    list_filter = ['is_primary', 'entity__organization']
    search_fields = ['entity__name', 'caption']
    readonly_fields = ['thumbnail', 'created_at']


@admin.register(EntityDocument)
class EntityDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'entity', 'document_type', 'created_at']
    list_filter = ['document_type', 'entity__organization']
    search_fields = ['title', 'entity__name']
    readonly_fields = ['created_at']


@admin.register(EntityShare)
class EntityShareAdmin(admin.ModelAdmin):
    list_display = ['entity', 'shared_with_department', 'shared_by_user', 'is_active', 'expires_at', 'created_at']
    list_filter = ['is_active', 'entity__organization']
    search_fields = ['entity__name', 'shared_with_department__name']
    readonly_fields = ['created_at']
