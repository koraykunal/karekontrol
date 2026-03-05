from django.db import migrations


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('execution', '0002_reminder'),
    ]

    operations = [
        migrations.RunPython(noop, noop),
    ]
