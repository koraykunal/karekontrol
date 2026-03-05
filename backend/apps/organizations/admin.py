from django.contrib import admin
from .models import Organization, Department


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'contact_email', 'contact_phone', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact_email', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'manager', 'code', 'created_at']
    list_filter = ['organization', 'created_at']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['organization', 'name']
    autocomplete_fields = ['organization', 'manager']
