from django.contrib import admin
from .models import Report, ReportDistribution, ReportSchedule


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'organization', 'department', 'report_type', 'status', 'period_display', 'created_at']
    list_filter = ['report_type', 'status', 'triggered_by', 'organization']
    search_fields = ['title', 'description']
    readonly_fields = ['file_size', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    def period_display(self, obj):
        return f"{obj.period_month}/{obj.period_year}"
    period_display.short_description = 'Period'


@admin.register(ReportDistribution)
class ReportDistributionAdmin(admin.ModelAdmin):
    list_display = ['report', 'user', 'delivery_method', 'status', 'download_count', 'distributed_at']
    list_filter = ['delivery_method', 'status']
    search_fields = ['report__title', 'user__full_name']
    readonly_fields = ['distributed_at', 'last_downloaded_at']


@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = ['report_type', 'organization', 'department', 'frequency', 'is_active', 'next_run']
    list_filter = ['report_type', 'frequency', 'is_active', 'organization']
    readonly_fields = ['last_run', 'created_at', 'updated_at']
