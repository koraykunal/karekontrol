from django.contrib import admin
from .models import ProcedureLog, StepLog, StepReminder, ProcedureShare


class StepLogInline(admin.TabularInline):
    model = StepLog
    extra = 0
    fields = ['step', 'is_completed', 'is_compliant', 'has_blocking_issue', 'completed_by_user', 'completed_at']
    readonly_fields = ['completed_at']
    can_delete = False


@admin.register(ProcedureLog)
class ProcedureLogAdmin(admin.ModelAdmin):
    list_display = ['procedure', 'entity', 'status', 'user', 'completion_percentage', 'is_overdue', 'started_at', 'completed_at']
    list_filter = ['status', 'has_unresolved_issues', 'blocked_by_issues', 'organization']
    search_fields = ['procedure__title', 'entity__name', 'user__full_name']
    readonly_fields = ['duration_formatted', 'is_overdue', 'created_at', 'updated_at']
    inlines = [StepLogInline]
    date_hierarchy = 'started_at'
    fieldsets = (
        ('Procedure Information', {
            'fields': ('organization', 'entity', 'procedure', 'user', 'completed_by_user')
        }),
        ('Status', {
            'fields': ('status', 'completion_percentage', 'has_unresolved_issues', 'blocked_by_issues', 'blocking_issues_count')
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'next_procedure_date', 'duration_minutes', 'duration_formatted', 'is_overdue')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Meta', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(StepLog)
class StepLogAdmin(admin.ModelAdmin):
    list_display = ['procedure_log', 'step', 'is_completed', 'is_compliant', 'has_blocking_issue', 'completed_by_user', 'completion_rate']
    list_filter = ['is_completed', 'is_compliant', 'has_blocking_issue', 'procedure_log__organization']
    search_fields = ['step__title', 'procedure_log__procedure__title', 'notes']
    readonly_fields = ['completion_rate', 'created_at', 'updated_at']


@admin.register(StepReminder)
class StepReminderAdmin(admin.ModelAdmin):
    list_display = ['user', 'procedure_log', 'remind_at', 'is_sent', 'sent_at']
    list_filter = ['is_sent', 'remind_at']
    search_fields = ['user__full_name', 'message']
    readonly_fields = ['sent_at', 'created_at']


@admin.register(ProcedureShare)
class ProcedureShareAdmin(admin.ModelAdmin):
    list_display = ['procedure_log', 'shared_with_department', 'shared_by_user', 'is_active', 'expires_at']
    list_filter = ['is_active', 'expires_at']
    search_fields = ['procedure_log__procedure__title', 'shared_with_department__name']
    readonly_fields = ['created_at']
