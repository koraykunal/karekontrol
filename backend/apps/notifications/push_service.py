import logging
from django.conf import settings
from django.utils import timezone
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)

logger = logging.getLogger(__name__)


class ExpoService:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            cls._client = PushClient()
        return cls._client

    @classmethod
    def send_push(cls, push_token, title, body, data=None, priority='high'):
        if not push_token or not push_token.startswith('ExponentPushToken'):
            return False
        push_token = push_token.replace('\n', '').replace('\r', '')

        try:
            message = PushMessage(
                to=push_token,
                title=title,
                body=body,
                data=data or {},
                priority=priority,
                sound='default'
            )
            response = cls.get_client().publish(message)
            response.validate_response()
            return True
        except DeviceNotRegisteredError:
            logger.warning(f"Device not registered: {push_token[:20]}...")
            return False
        except PushTicketError as e:
            logger.error(f"Push ticket error: {e}")
            return False
        except PushServerError as e:
            logger.error(f"Push server error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected push error: {e}")
            return False

    @classmethod
    def send_to_user(cls, user, title, body, data=None, priority='high'):
        from .models import PushToken

        tokens = list(PushToken.objects.filter(user=user, is_active=True))
        if not tokens:
            return 0

        messages = []
        for token_obj in tokens:
            t = token_obj.token.replace('\n', '').replace('\r', '')
            if t and t.startswith('ExponentPushToken'):
                messages.append(PushMessage(to=t, title=title, body=body, data=data or {}, priority=priority, sound='default'))

        if not messages:
            return 0

        success_count = 0
        try:
            responses = cls.get_client().publish_multiple(messages)
            for i, response in enumerate(responses):
                try:
                    response.validate_response()
                    tokens[i].last_used_at = timezone.now()
                    tokens[i].save(update_fields=['last_used_at'])
                    success_count += 1
                except DeviceNotRegisteredError:
                    tokens[i].is_active = False
                    tokens[i].save(update_fields=['is_active'])
                except (PushTicketError, Exception):
                    pass
        except Exception as e:
            logger.error(f"Batch push error: {e}")

        return success_count

    @classmethod
    def send_bulk(cls, users, title, body, data=None, priority='high'):
        total_sent = 0
        for user in users:
            total_sent += cls.send_to_user(user, title, body, data, priority)
        return total_sent
