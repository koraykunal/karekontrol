from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.permissions.engine import PermissionEngine
from apps.permissions.models import PermissionPolicy
from apps.entities.services import EntityService
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug permissions for a specific user'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email')

    def handle(self, *args, **options):
        email = options['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {email} not found'))
            return

        self.stdout.write(self.style.SUCCESS(f'--- User Info ---'))
        self.stdout.write(f'ID: {user.id}')
        self.stdout.write(f'Name: {user.full_name}')
        self.stdout.write(f'Role: {user.role}')
        self.stdout.write(f'Organization: {user.organization} (ID: {user.organization_id})')
        self.stdout.write(f'Department: {user.department} (ID: {user.department_id})')
        self.stdout.write(f'Is Active: {user.is_active}')
        self.stdout.write(f'Is Super Admin: {user.is_super_admin}')

        self.stdout.write(self.style.SUCCESS(f'\n--- Permission Policy Check ---'))
        policies = PermissionPolicy.objects.filter(
            role=user.role,
            is_active=True
        )
        org_policies = policies.filter(organization=user.organization)
        dept_policies = policies.filter(department=user.department) if user.department else []

        self.stdout.write(f'Total Policies for role {user.role}: {policies.count()}')
        self.stdout.write(f'Policies matching Org {user.organization}: {org_policies.count()}')
        if user.department:
            self.stdout.write(f'Policies matching Dept {user.department}: {dept_policies.count()}')
            for p in dept_policies:
                self.stdout.write(f'  - Found Dept Policy: {p.permissions}')
        else:
             self.stdout.write(f'Policies matching Dept: N/A (User has no dept)')

        self.stdout.write(self.style.SUCCESS(f'\n--- Effective Permissions ---'))
        perms = PermissionEngine.get_user_permissions(user)
        self.stdout.write(json.dumps(perms, indent=2))

        self.stdout.write(self.style.SUCCESS(f'\n--- Entity Visibility ---'))
        try:
            entities = EntityService.get_entities_for_user(user)
            count = entities.count()
            self.stdout.write(f'Visible Entities Count: {count}')
            for e in entities[:5]:
                self.stdout.write(f' - {e.name} ({e.department})')
        except Exception as e:
             self.stdout.write(self.style.ERROR(f'Error fetching entities: {e}'))
