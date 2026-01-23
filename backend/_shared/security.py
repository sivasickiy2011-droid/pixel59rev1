import os
import re
import html
from typing import Optional, Dict, Any, Union
import redis

from backend.token_utils import verify_jwt
from .db_secrets import get_db_connection

# simple redis client for rate limiting
def get_redis_client():
    url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    return redis.from_url(url, decode_responses=True)

def sanitize_text(value: str) -> str:
    if not isinstance(value, str):
        return ''
    value = html.escape(value)
    return re.sub(r'[\r\n]{2,}', '\n', value).strip()

def is_valid_phone(phone: str) -> bool:
    return bool(re.fullmatch(r"\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}", phone))

def is_valid_email(email: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", email))

def rate_limited(key: str, limit: int = 5, window_seconds: int = 60) -> bool:
    client = get_redis_client()
    pipe = client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    count, _ = pipe.execute()
    return count > limit

def validate_origin(origin: str, allowed: Optional[list[str]] = None) -> bool:
    if not origin:
        return False
    allowed = allowed or os.environ.get('ALLOWED_ORIGINS', '').split(',')
    for pattern in [o.strip() for o in allowed if o.strip()]:
        if pattern in origin:
            return True
    return False

def check_honeypot(form: Dict[str, Any], field: str = 'botField') -> bool:
    return bool(form.get(field))


def get_admin_token(headers: Optional[Dict[str, str]]) -> Optional[str]:
    if not headers:
        return None
    token = headers.get('x-admin-token') or headers.get('X-Admin-Token')
    if token:
        return token
    authorization = headers.get('Authorization') or headers.get('authorization', '')
    if authorization.startswith('Bearer '):
        return authorization.split('Bearer ', 1)[1].strip()
    return None


def ensure_admin_authorized(headers: Optional[Dict[str, str]]) -> Union[Dict[str, Any], None]:
    token = get_admin_token(headers)
    if not token:
        return None
    secret = os.environ.get('JWT_SECRET', '')
    if not secret:
        return None
    return verify_jwt(token, secret)


def build_rate_limit_key(prefix: str, event: Dict[str, Any]) -> str:
    identity = event.get('requestContext', {}).get('identity', {})
    ip_address = identity.get('sourceIp') or identity.get('source_ip') or 'anonymous'
    return f"{prefix}:{ip_address}"


def enforce_rate_limit(prefix: str, event: Dict[str, Any], limit: int = 30, window_seconds: int = 60) -> bool:
    key = build_rate_limit_key(prefix, event)
    client = get_redis_client()
    pipe = client.pipeline()
    pipe.incr(key)
    pipe.expire(key, window_seconds)
    count, _ = pipe.execute()
    return count > limit


def is_valid_image_url(value: str) -> bool:
    if not value or not isinstance(value, str):
        return False
    pattern = re.compile(r'^https?://[\w\-./?=%&]+\.(jpg|jpeg|png|gif|webp)$', re.IGNORECASE)
    return bool(pattern.search(value))
