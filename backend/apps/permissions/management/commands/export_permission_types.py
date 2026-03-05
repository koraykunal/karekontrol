import os
from django.core.management.base import BaseCommand
from apps.permissions.enums import PermissionKey, PermissionScope
from apps.core.constants import UserRole


class Command(BaseCommand):
    help = 'Export permission enums to TypeScript types for frontend'

    def handle(self, *args, **options):
        ts_content = self._generate_typescript()

        output_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            '..',
            '..',
            '..',
            '..',
            'mobile',
            'src',
            'types',
            'permissions.generated.ts'
        )

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)

        self.stdout.write(
            self.style.SUCCESS(f'Successfully exported permission types to {output_path}')
        )

    def _generate_typescript(self) -> str:
        permission_keys = [key for key, _ in PermissionKey.choices]
        permission_scopes = [key for key, _ in PermissionScope.choices]
        user_roles = [key for key, _ in UserRole.choices]

        permission_labels = {key: label for key, label in PermissionKey.choices}
        scope_labels = {key: label for key, label in PermissionScope.choices}
        role_labels = {key: label for key, label in UserRole.choices}

        ts_lines = [
            "export type PermissionKey =",
        ]

        for i, key in enumerate(permission_keys):
            separator = " |" if i < len(permission_keys) - 1 else ";"
            ts_lines.append(f"  | '{key}'{separator}")

        ts_lines.append("")
        ts_lines.append("export type PermissionScope =")
        for i, scope in enumerate(permission_scopes):
            separator = " |" if i < len(permission_scopes) - 1 else ";"
            ts_lines.append(f"  | '{scope}'{separator}")

        ts_lines.append("")
        ts_lines.append("export type UserRole =")
        for i, role in enumerate(user_roles):
            separator = " |" if i < len(user_roles) - 1 else ";"
            ts_lines.append(f"  | '{role}'{separator}")

        ts_lines.append("")
        ts_lines.append("export interface PermissionConfig {")
        ts_lines.append("  enabled: boolean;")
        ts_lines.append("  scope?: PermissionScope;")
        ts_lines.append("}")

        ts_lines.append("")
        ts_lines.append("export type UserPermissions = {")
        ts_lines.append("  [key in PermissionKey]?: PermissionConfig;")
        ts_lines.append("};")

        ts_lines.append("")
        ts_lines.append("export const PERMISSION_LABELS: Record<PermissionKey, string> = {")
        for i, (key, label) in enumerate(permission_labels.items()):
            separator = "," if i < len(permission_labels) - 1 else ""
            ts_lines.append(f"  '{key}': '{label}'{separator}")
        ts_lines.append("};")

        ts_lines.append("")
        ts_lines.append("export const SCOPE_LABELS: Record<PermissionScope, string> = {")
        for i, (key, label) in enumerate(scope_labels.items()):
            separator = "," if i < len(scope_labels) - 1 else ""
            ts_lines.append(f"  '{key}': '{label}'{separator}")
        ts_lines.append("};")

        ts_lines.append("")
        ts_lines.append("export const ROLE_LABELS: Record<UserRole, string> = {")
        for i, (key, label) in enumerate(role_labels.items()):
            separator = "," if i < len(role_labels) - 1 else ""
            ts_lines.append(f"  '{key}': '{label}'{separator}")
        ts_lines.append("};")

        return "\n".join(ts_lines) + "\n"
