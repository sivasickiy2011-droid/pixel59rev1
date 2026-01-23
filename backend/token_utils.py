import base64
import hashlib
import hmac
import json
from datetime import datetime
from typing import Any, Dict, Optional


def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def base64url_decode(value: str) -> bytes:
    padding = '=' * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hmac_sha256(payload: str, secret: str) -> str:
    digest = hmac.new(secret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).digest()
    return base64url_encode(digest)


def create_jwt(payload: Dict[str, Any], secret: str, expiry_seconds: int) -> str:
    now = int(datetime.utcnow().timestamp())
    claims = {**payload, 'iat': now, 'exp': now + expiry_seconds}
    header = {'alg': 'HS256', 'typ': 'JWT'}
    segments = [
        base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8')),
        base64url_encode(json.dumps(claims, separators=(',', ':')).encode('utf-8'))
    ]
    signature = hmac_sha256('.'.join(segments), secret)
    segments.append(signature)
    return '.'.join(segments)


def verify_jwt(token: str, secret: str) -> Optional[Dict[str, Any]]:
    try:
        header_b64, payload_b64, signature = token.split('.')
    except ValueError:
        return None
    signed_part = '.'.join([header_b64, payload_b64])
    if hmac_sha256(signed_part, secret) != signature:
        return None
    payload = json.loads(base64url_decode(payload_b64))
    if payload.get('exp') and payload['exp'] < int(datetime.utcnow().timestamp()):
        return None
    return payload
