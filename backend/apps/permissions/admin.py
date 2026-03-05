from django.contrib import admin
from .models import ProcedureAssignment, PermissionPolicy


@admin.register(ProcedureAssignment)
class ProcedureAssignmentAdmin(admin.ModelAdmin):
    list_display = ['procedure', 'assigned_to_user', 'status', 'valid_from', 'valid_until', 'is_active']
    list_filter = ['status', 'is_active', 'recurring']
    search_fields = ['procedure__title', 'assigned_to_user__full_name', 'assignment_reason']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'valid_from'


@admin.register(PermissionPolicy)
class PermissionPolicyAdmin(admin.ModelAdmin):
    list_display = ['role', 'organization', 'department', 'is_active', 'configured_by']
    list_filter = ['role', 'is_active', 'organization']
    search_fields = ['role', 'notes', 'organization__name']
    readonly_fields = ['created_at', 'updated_at']
