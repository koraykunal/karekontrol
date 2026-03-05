import uuid
from django.db import migrations, models


def populate_company_numbers(apps, schema_editor):
    """Assign placeholder company numbers to existing organizations."""
    Organization = apps.get_model('organizations', 'Organization')
    for org in Organization.objects.filter(company_number__isnull=True):
        org.company_number = f'TEMP-{org.id}-{uuid.uuid4().hex[:8].upper()}'
        org.save(update_fields=['company_number'])


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0001_initial'),
    ]

    operations = [
        # Step 1: Add nullable fields
        migrations.AddField(
            model_name='organization',
            name='company_number',
            field=models.CharField(max_length=50, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='registration_number',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='organization',
            name='qr_quota',
            field=models.PositiveIntegerField(default=0, help_text='0 = unlimited'),
        ),
        # Step 2: Populate placeholders for existing rows
        migrations.RunPython(populate_company_numbers, migrations.RunPython.noop),
        # Step 3: Make company_number non-null + unique + indexed
        migrations.AlterField(
            model_name='organization',
            name='company_number',
            field=models.CharField(max_length=50, unique=True, db_index=True),
        ),
        # Step 4: Add index
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['company_number'], name='organizations_company_0e1f2a_idx'),
        ),
    ]
