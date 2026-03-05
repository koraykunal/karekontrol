import os
from django.core.management.base import BaseCommand
from apps.organizations.models import Organization
from apps.organizations.sandbox import seed_sandbox_organization


class Command(BaseCommand):
    help = 'Populates the database with demo data for Orion Studio (sandbox)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default=None,
            help='Password to set for all demo users (overrides DEMO_PASSWORD env var)',
        )

    def handle(self, *args, **options):
        demo_password = options['password'] or os.environ.get('DEMO_PASSWORD')
        if not demo_password:
            self.stderr.write(self.style.ERROR(
                'No demo password provided. Set DEMO_PASSWORD env var or use --password flag.'
            ))
            return

        self.stdout.write('Creating sandbox organization: Orion Studio...')

        org, created = Organization.objects.get_or_create(
            name='Orion Studio',
            defaults={
                'company_number': 'SANDBOX-001',
                'description': 'Advanced Engineering and Design Solutions',
                'address': 'Karaköy, Beyoğlu, İstanbul',
                'is_active': True,
                'is_sandbox': True,
            }
        )

        if not created:
            org.is_sandbox = True
            org.save(update_fields=['is_sandbox'])

        result = seed_sandbox_organization(org, demo_password)

        self.stdout.write(self.style.SUCCESS(
            f"Sandbox ready: {result['entities_created']} entities, "
            f"{result['procedures_created']} procedures, "
            f"{result['users_created']} users"
        ))
