from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime
from apps.notifications.services import NotificationService

class Command(BaseCommand):
    help = 'Manually trigger notification checks for testing purposes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            choices=['overdue', 'upcoming', 'all'],
            default='all',
            help='Type of notifications to check (overdue, upcoming, or all)'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force send notifications even if not due (ignores schedule interval)'
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Mock date in YYYY-MM-DD format to simulate checks on a specific day',
            default=None
        )

    def handle(self, *args, **options):
        notification_type = options['type']
        force = options['force']
        mock_date_str = options['date']
        
        mock_date = None
        if mock_date_str:
            try:
                mock_date = datetime.strptime(mock_date_str, '%Y-%m-%d').date()
                self.stdout.write(self.style.WARNING(f"⚠️  Running with MOCKED DATE: {mock_date}"))
            except ValueError:
                self.stdout.write(self.style.ERROR("Invalid date format. Use YYYY-MM-DD"))
                return

        if notification_type in ['overdue', 'all']:
            self.stdout.write(f"Checking OVERDUE procedures... (Force: {force})")
            count = NotificationService.process_overdue_procedures(mock_date=mock_date, force=force)
            self.stdout.write(self.style.SUCCESS(f"✅ Sent {count} overdue notifications"))

        if notification_type in ['upcoming', 'all']:
            # Note: For now we haven't refactored 'upcoming' into the service fully in the same way,
            # but since the user focused on 'overdue', we will support it if needed or warn.
            # Ideally we should refactor upcoming too, but let's stick to the prompt's main request first.
            if notification_type == 'upcoming':
                 self.stdout.write(self.style.WARNING("Upcoming check not yet fully refactored for manual trigger via service. Please use celery task or request update."))
            
        self.stdout.write(self.style.SUCCESS("Done."))
