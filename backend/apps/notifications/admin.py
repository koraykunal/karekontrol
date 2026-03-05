from django.contrib import admin
from .models import Notification, PushToken, NotificationSchedule, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'type', 'priority', 'is_read', 'created_at']
    list_filter = ['type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__full_name']
    readonly_fields = ['read_at', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'device_type', 'device_name', 'is_active', 'last_used_at']
    list_filter = ['device_type', 'is_active']
    search_fields = ['user__full_name', 'token', 'device_name']
    readonly_fields = ['last_used_at', 'created_at']


@admin.register(NotificationSchedule)
class NotificationScheduleAdmin(admin.ModelAdmin):
    list_display = ['notification_key', 'notification_type', 'target_user', 'is_active', 'next_send_at', 'send_count']
    list_filter = ['notification_type', 'is_active', 'target_completed']
    search_fields = ['notification_key', 'target_user__full_name']
    readonly_fields = ['created_at', 'updated_at', 'last_sent_at', 'send_count']
    date_hierarchy = 'next_send_at'


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'push_enabled', 'quiet_hours_enabled', 'reminder_days_before']
    list_filter = ['push_enabled', 'quiet_hours_enabled', 'procedure_due_enabled', 'issue_enabled']
    search_fields = ['user__full_name']
    readonly_fields = ['created_at', 'updated_at']
