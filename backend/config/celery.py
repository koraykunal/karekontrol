import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

app = Celery('karekontrol')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-overdue-procedures-frequent': {
        'task': 'apps.notifications.tasks.check_overdue_procedures',
        'schedule': crontab(minute='*/15'),
    },
    'check-upcoming-procedures-daily': {
        'task': 'apps.notifications.tasks.check_upcoming_procedures',
        'schedule': crontab(hour=8, minute=0),
    },
    'check-overdue-issues-hourly': {
        'task': 'apps.notifications.tasks.check_overdue_issues',
        'schedule': crontab(minute=30),
    },
    'cleanup-old-notifications-weekly': {
        'task': 'apps.notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
    },
    'send-step-reminders-every-minute': {
        'task': 'apps.notifications.tasks.send_step_reminders',
        'schedule': crontab(minute='*/5'),
    },
    'generate-monthly-reports': {
        'task': 'apps.reporting.tasks.generate_monthly_reports',
        'schedule': crontab(hour=2, minute=0, day_of_month=1),
    },
    'cleanup-old-report-files': {
        'task': 'apps.reporting.tasks.cleanup_old_report_files',
        'schedule': crontab(hour=4, minute=0, day_of_week=0),
    },
}
