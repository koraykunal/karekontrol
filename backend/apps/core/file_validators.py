import magic
from django.core.exceptions import ValidationError


ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
}

ALLOWED_VIDEO_TYPES = {
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
    'video/webm': ['.webm'],
}

ALLOWED_DOCUMENT_TYPES = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/plain': ['.txt'],
}

MAX_FILE_SIZE = 50 * 1024 * 1024


def validate_file_upload(file, expected_category='any'):
    if file.size > MAX_FILE_SIZE:
        raise ValidationError(f'File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024 * 1024)}MB')

    file_mime = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)

    extension = file.name.split('.')[-1].lower()
    extension_with_dot = f'.{extension}'

    allowed_types = {}
    if expected_category == 'images':
        allowed_types = ALLOWED_IMAGE_TYPES
    elif expected_category == 'videos':
        allowed_types = ALLOWED_VIDEO_TYPES
    elif expected_category == 'documents':
        allowed_types = ALLOWED_DOCUMENT_TYPES
    else:
        allowed_types = {**ALLOWED_IMAGE_TYPES, **ALLOWED_VIDEO_TYPES, **ALLOWED_DOCUMENT_TYPES}

    if file_mime not in allowed_types:
        raise ValidationError(f'File type {file_mime} is not allowed')

    if extension_with_dot not in allowed_types[file_mime]:
        raise ValidationError(f'File extension .{extension} does not match content type {file_mime}')

    return file_mime, extension_with_dot
