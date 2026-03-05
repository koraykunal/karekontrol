import uuid
import os
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from django.core.files.storage import default_storage


def generate_unique_code(prefix='', length=8):
    unique_id = uuid.uuid4().hex[:length].upper()
    return f"{prefix}{unique_id}" if prefix else unique_id


def get_upload_path(instance, filename):
    # Backward compatibility wrapper or default
    return get_organization_upload_path(instance, filename)


def get_organization_upload_path(instance, filename):
    _, ext = os.path.splitext(filename)
    new_filename = f"{uuid.uuid4().hex}{ext}" if ext else uuid.uuid4().hex
    
    today = timezone.now().strftime('%Y/%m/%d')
    
    org_id = 'common'
    
    # Try to resolve organization from various common patterns
    if hasattr(instance, 'organization_id') and instance.organization_id:
        org_id = str(instance.organization_id)
    elif hasattr(instance, 'entity') and hasattr(instance.entity, 'organization_id') and instance.entity.organization_id:
        org_id = str(instance.entity.organization_id)
    elif hasattr(instance, 'report') and hasattr(instance.report, 'organization_id') and instance.report.organization_id:
        org_id = str(instance.report.organization_id)
    elif hasattr(instance, 'user') and hasattr(instance.user, 'organization_id') and instance.user.organization_id:
        # Fallback for user avatars or private user files
        org_id = str(instance.user.organization_id)
        
    return os.path.join('uploads', f"org_{org_id}", today, new_filename)


def calculate_next_procedure_date(interval_value, interval_unit, start_date=None):
    if start_date is None:
        start_date = timezone.now().date()

    unit_map = {
        'DAYS': relativedelta(days=interval_value),
        'WEEKS': relativedelta(weeks=interval_value),
        'MONTHS': relativedelta(months=interval_value),
        'YEARS': relativedelta(years=interval_value),
    }

    delta = unit_map.get(interval_unit)
    if delta is None:
        return start_date

    return start_date + delta


def get_week_number(date):
    return date.isocalendar()[1]


def get_month_year_string(date):
    return date.strftime('%Y-%m')
