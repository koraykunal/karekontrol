from django.contrib import admin
from .models import Procedure, ProcedureStep, ProcedureTemplate


class ProcedureStepInline(admin.TabularInline):
    model = ProcedureStep
    extra = 1
    fields = ['step_order', 'title', 'description', 'requires_photo', 'requires_notes', 'requires_compliance_check', 'expected_duration_minutes']
    ordering = ['step_order']


@admin.register(Procedure)
class ProcedureAdmin(admin.ModelAdmin):
    list_display = ['title', 'entity', 'priority', 'interval_display', 'is_active', 'total_steps', 'created_at']
    list_filter = ['priority', 'is_active', 'interval_unit', 'organization', 'requires_approval', 'is_deleted']
    search_fields = ['title', 'entity__name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'total_steps', 'estimated_duration_formatted']
    inlines = [ProcedureStepInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('organization', 'entity', 'title', 'description', 'priority')
        }),
        ('Scheduling', {
            'fields': ('interval_value', 'interval_unit', 'estimated_duration_minutes', 'estimated_duration_formatted')
        }),
        ('Settings', {
            'fields': ('is_active', 'requires_approval', 'tags')
        }),
        ('Meta', {
            'fields': ('created_by', 'total_steps', 'is_deleted', 'deleted_at', 'created_at', 'updated_at')
        }),
    )

    def interval_display(self, obj):
        return f"{obj.interval_value} {obj.get_interval_unit_display()}"
    interval_display.short_description = 'Interval'


@admin.register(ProcedureStep)
class ProcedureStepAdmin(admin.ModelAdmin):
    list_display = ['procedure', 'step_order', 'title', 'requires_photo', 'requires_notes', 'requires_compliance_check']
    list_filter = ['requires_photo', 'requires_notes', 'requires_compliance_check', 'procedure__organization']
    search_fields = ['title', 'procedure__title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['procedure', 'step_order']


@admin.register(ProcedureTemplate)
class ProcedureTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'category', 'is_public', 'usage_count', 'created_at']
    list_filter = ['is_public', 'category', 'organization']
    search_fields = ['name', 'description', 'category']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']
