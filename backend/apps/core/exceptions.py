import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from rest_framework import status
from rest_framework.response import Response
from django.utils import timezone
from django.http import Http404
from django.core.exceptions import PermissionDenied

logger = logging.getLogger(__name__)


class AuthenticationError(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = 'Authentication failed.'
    default_code = 'authentication_error'


class AuthorizationError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'authorization_error'


class NotFoundError(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class ValidationError(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Validation error.'
    default_code = 'validation_error'


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource conflict.'
    default_code = 'conflict_error'


class BadRequestError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Bad request.'
    default_code = 'bad_request'


class BusinessLogicError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Business logic error.'
    default_code = 'business_logic_error'


class ProcedureBlockedError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Procedure is blocked by unresolved issues.'
    default_code = 'procedure_blocked'


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, Http404):
        response = Response(status=status.HTTP_404_NOT_FOUND)
        exc = NotFoundError(detail=str(exc))

    elif isinstance(exc, PermissionDenied):
        response = Response(status=status.HTTP_403_FORBIDDEN)
        exc = AuthorizationError(detail=str(exc))

    if response is not None:
        error_code = getattr(exc, 'default_code', 'error')
        error_message = str(exc)
        error_details = {}

        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                if 'non_field_errors' in exc.detail:
                    items = exc.detail['non_field_errors']
                    error_message = ', '.join(str(item) for item in items)
                elif 'detail' in exc.detail:
                    error_message = str(exc.detail['detail'])
                else:
                    first_value = next(iter(exc.detail.values()), None)
                    if first_value:
                        if isinstance(first_value, list):
                            error_message = ', '.join(str(item) for item in first_value)
                        else:
                            error_message = str(first_value)
                error_details = {
                    k: [str(e) for e in v] if isinstance(v, list) else [str(v)]
                    for k, v in exc.detail.items()
                }
            elif isinstance(exc.detail, list):
                error_message = ', '.join(str(item) for item in exc.detail)
            else:
                error_message = str(exc.detail)

        error_payload = {
            'success': False,
            'error': {
                'code': error_code,
                'message': error_message,
                'details': error_details,
            },
            'timestamp': timezone.now().isoformat()
        }
        response.data = error_payload

        if response.status_code >= 500:
            logger.error(
                f"Server error: {error_code} - {error_message}",
                exc_info=exc,
                extra={'context': context}
            )
        elif response.status_code >= 400:
            logger.warning(
                f"Client error: {error_code} - {error_message}",
                extra={'context': context}
            )
    else:
        logger.exception(
            f"Unhandled exception: {type(exc).__name__} - {str(exc)}",
            exc_info=exc,
            extra={'context': context}
        )
        response = Response({
            'success': False,
            'error': {
                'code': 'internal_server_error',
                'message': 'An unexpected error occurred.',
                'details': {}
            },
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
