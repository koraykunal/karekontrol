"""Data migration to convert all lowercase enum values to UPPERCASE for API consistency."""
from django.db import migrations


def uppercase_enum_values(apps, schema_editor):
    # ProcedureLog.status: in_progress → IN_PROGRESS, completed → COMPLETED, cancelled → CANCELLED
    ProcedureLog = apps.get_model('execution', 'ProcedureLog')
    for old, new in [('in_progress', 'IN_PROGRESS'), ('completed', 'COMPLETED'), ('cancelled', 'CANCELLED')]:
        ProcedureLog.objects.filter(status=old).update(status=new)

    # Entity.status
    Entity = apps.get_model('entities', 'Entity')
    for old, new in [('active', 'ACTIVE'), ('inactive', 'INACTIVE'), ('maintenance', 'MAINTENANCE'), ('decommissioned', 'DECOMMISSIONED')]:
        Entity.objects.filter(status=old).update(status=new)

    # HelpRequest.status
    HelpRequest = apps.get_model('compliance', 'HelpRequest')
    for old, new in [('pending', 'PENDING'), ('accepted', 'ACCEPTED'), ('rejected', 'REJECTED'), ('completed', 'COMPLETED')]:
        HelpRequest.objects.filter(status=old).update(status=new)

    # Notification.priority
    Notification = apps.get_model('notifications', 'Notification')
    for old, new in [('low', 'LOW'), ('normal', 'NORMAL'), ('high', 'HIGH'), ('urgent', 'URGENT')]:
        Notification.objects.filter(priority=old).update(priority=new)

    # PushToken.device_type
    PushToken = apps.get_model('notifications', 'PushToken')
    for old, new in [('ios', 'IOS'), ('android', 'ANDROID'), ('web', 'WEB')]:
        PushToken.objects.filter(device_type=old).update(device_type=new)

    # ReportDistribution.status + delivery_method
    ReportDistribution = apps.get_model('reporting', 'ReportDistribution')
    for old, new in [('pending', 'PENDING'), ('sent', 'SENT'), ('failed', 'FAILED')]:
        ReportDistribution.objects.filter(status=old).update(status=new)
    for old, new in [('email', 'EMAIL'), ('push', 'PUSH'), ('portal', 'PORTAL')]:
        ReportDistribution.objects.filter(delivery_method=old).update(delivery_method=new)

    # ReportSchedule.frequency
    ReportSchedule = apps.get_model('reporting', 'ReportSchedule')
    for old, new in [('daily', 'DAILY'), ('weekly', 'WEEKLY'), ('monthly', 'MONTHLY'), ('quarterly', 'QUARTERLY'), ('annual', 'ANNUAL')]:
        ReportSchedule.objects.filter(frequency=old).update(frequency=new)

    # EntityDocument.document_type
    EntityDocument = apps.get_model('entities', 'EntityDocument')
    for old, new in [('manual', 'MANUAL'), ('certificate', 'CERTIFICATE'), ('warranty', 'WARRANTY'), ('invoice', 'INVOICE'), ('other', 'OTHER')]:
        EntityDocument.objects.filter(document_type=old).update(document_type=new)


def lowercase_enum_values(apps, schema_editor):
    """Reverse migration — convert back to lowercase."""
    ProcedureLog = apps.get_model('execution', 'ProcedureLog')
    for old, new in [('IN_PROGRESS', 'in_progress'), ('COMPLETED', 'completed'), ('CANCELLED', 'cancelled')]:
        ProcedureLog.objects.filter(status=old).update(status=new)

    Entity = apps.get_model('entities', 'Entity')
    for old, new in [('ACTIVE', 'active'), ('INACTIVE', 'inactive'), ('MAINTENANCE', 'maintenance'), ('DECOMMISSIONED', 'decommissioned')]:
        Entity.objects.filter(status=old).update(status=new)

    HelpRequest = apps.get_model('compliance', 'HelpRequest')
    for old, new in [('PENDING', 'pending'), ('ACCEPTED', 'accepted'), ('REJECTED', 'rejected'), ('COMPLETED', 'completed')]:
        HelpRequest.objects.filter(status=old).update(status=new)

    Notification = apps.get_model('notifications', 'Notification')
    for old, new in [('LOW', 'low'), ('NORMAL', 'normal'), ('HIGH', 'high'), ('URGENT', 'urgent')]:
        Notification.objects.filter(priority=old).update(priority=new)

    PushToken = apps.get_model('notifications', 'PushToken')
    for old, new in [('IOS', 'ios'), ('ANDROID', 'android'), ('WEB', 'web')]:
        PushToken.objects.filter(device_type=old).update(device_type=new)

    ReportDistribution = apps.get_model('reporting', 'ReportDistribution')
    for old, new in [('PENDING', 'pending'), ('SENT', 'sent'), ('FAILED', 'failed')]:
        ReportDistribution.objects.filter(status=old).update(status=new)
    for old, new in [('EMAIL', 'email'), ('PUSH', 'push'), ('PORTAL', 'portal')]:
        ReportDistribution.objects.filter(delivery_method=old).update(delivery_method=new)

    ReportSchedule = apps.get_model('reporting', 'ReportSchedule')
    for old, new in [('DAILY', 'daily'), ('WEEKLY', 'weekly'), ('MONTHLY', 'monthly'), ('QUARTERLY', 'quarterly'), ('ANNUAL', 'annual')]:
        ReportSchedule.objects.filter(frequency=old).update(frequency=new)

    EntityDocument = apps.get_model('entities', 'EntityDocument')
    for old, new in [('MANUAL', 'manual'), ('CERTIFICATE', 'certificate'), ('WARRANTY', 'warranty'), ('INVOICE', 'invoice'), ('OTHER', 'other')]:
        EntityDocument.objects.filter(document_type=old).update(document_type=new)


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('execution', '0003_update_status_to_lowercase'),
        ('entities', '0003_alter_entity_qr_image_alter_entitydocument_file_and_more'),
        ('compliance', '0001_initial'),
        ('notifications', '0003_add_is_persistent_to_notification'),
        ('reporting', '0002_alter_report_file'),
    ]

    operations = [
        migrations.RunPython(uppercase_enum_values, lowercase_enum_values),
    ]
