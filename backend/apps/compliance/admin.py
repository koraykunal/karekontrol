from django.contrib import admin
from .models import NonComplianceIssue, IssueComment, HelpRequest


class IssueCommentInline(admin.TabularInline):
    model = IssueComment
    extra = 1
    fields = ['user', 'content', 'is_internal', 'created_at']
    readonly_fields = ['created_at']


@admin.register(NonComplianceIssue)
class NonComplianceIssueAdmin(admin.ModelAdmin):
    list_display = ['title', 'severity', 'status', 'entity', 'reported_by', 'assigned_to_user', 'is_overdue', 'created_at']
    list_filter = ['severity', 'status', 'category', 'assigned_to_department']
    search_fields = ['title', 'description', 'entity__name']
    readonly_fields = ['is_overdue', 'created_at', 'updated_at', 'resolved_at']
    inlines = [IssueCommentInline]
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Issue Information', {
            'fields': ('title', 'description', 'severity', 'status', 'category', 'tags')
        }),
        ('Related', {
            'fields': ('entity', 'procedure_log', 'step_log')
        }),
        ('Assignment', {
            'fields': ('assigned_to_department', 'assigned_to_user', 'due_date', 'is_overdue')
        }),
        ('Reporter', {
            'fields': ('reported_by', 'photo_urls')
        }),
        ('Resolution', {
            'fields': ('resolved_by', 'resolved_at', 'resolved_notes', 'resolution_photo_urls')
        }),
        ('Meta', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(IssueComment)
class IssueCommentAdmin(admin.ModelAdmin):
    list_display = ['issue', 'user', 'content_preview', 'is_internal', 'created_at']
    list_filter = ['is_internal', 'created_at']
    search_fields = ['content', 'issue__title', 'user__full_name']
    readonly_fields = ['created_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(HelpRequest)
class HelpRequestAdmin(admin.ModelAdmin):
    list_display = ['from_department', 'to_department', 'issue', 'status', 'requested_by', 'responded_by', 'created_at']
    list_filter = ['status', 'from_department', 'to_department']
    search_fields = ['message', 'response_message', 'issue__title']
    readonly_fields = ['responded_at', 'created_at']
