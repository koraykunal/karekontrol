from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'resource_type', 'resource_title', 'organization', 'log_date', 'created_at']
    list_filter = ['action', 'resource_type', 'log_date', 'organization', 'department']
    search_fields = ['action', 'resource_title', 'user__full_name', 'ip_address']
    readonly_fields = ['log_date', 'week_number', 'month_year', 'created_at', 'updated_at']
    date_hierarchy = 'log_date'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
