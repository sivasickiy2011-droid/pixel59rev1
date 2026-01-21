import json
import os
import secrets
from typing import Any, Dict

import psycopg2
import redis

from .bcrypt_utils import verify_password
from backend.token_utils import create_jwt, verify_jwt

ATTEMPT_WINDOW_SECONDS = 60
MAX_ATTEMPTS_PER_WINDOW = 5
LOCKOUT_SECONDS = 300
ACCESS_TOKEN_SECONDS = 900
REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60


def get_redis_client() -> redis.Redis:
    url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    return redis.from_url(url, decode_responses=True)


def response(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body),
        'isBase64Encoded': False
    }


def cors_response(status: int) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        },
        'body': '',
        'isBase64Encoded': False
    }


def log_login_attempt(ip_address: str, user_agent: str, success: bool) -> None:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO admin_login_logs (ip_address, user_agent, success) VALUES (%s, %s, %s)",
        (ip_address, user_agent, success)
    )
    conn.commit()
    cursor.close()
    conn.close()


def get_password_hash_from_db() -> str:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return ''
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT password_hash FROM users WHERE id = 2 OR username = 'suser' LIMIT 1"
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row[0] if row else ''


def rate_limited(ip_address: str) -> bool:
    client = get_redis_client()
    attempts = client.get(f"auth-admin:attempts:{ip_address}")
    return bool(attempts and int(attempts) >= MAX_ATTEMPTS_PER_WINDOW)


def record_attempt(ip_address: str, success: bool) -> None:
    client = get_redis_client()
    key = f"auth-admin:attempts:{ip_address}"
    if success:
        client.delete(key)
        client.delete(f"auth-admin:lock:{ip_address}")
        return
    pipe = client.pipeline()
    pipe.incr(key)
    pipe.expire(key, ATTEMPT_WINDOW_SECONDS)
    pipe.execute()
    if int(client.get(key) or 0) >= MAX_ATTEMPTS_PER_WINDOW:
        client.setex(f"auth-admin:lock:{ip_address}", LOCKOUT_SECONDS, '1')


def is_locked(ip_address: str) -> bool:
    client = get_redis_client()
    return client.exists(f"auth-admin:lock:{ip_address}") == 1


def validate_captcha(payload: Dict[str, Any]) -> bool:
    if hidden := payload.get('honeypot', ''):
        return False
    token = payload.get('captcha_token', '')
    expected = os.environ.get('CAPTCHA_TOKEN_EXPECTED')
    return not expected or token == expected


def validate_twofa(code: str) -> bool:
    expected = os.environ.get('ADMIN_2FA_CODE')
    if not expected or not code:
        return True
    return secrets.compare_digest(str(code), expected)


def generate_tokens(user_id: int) -> Dict[str, str]:
    secret = os.environ.get('JWT_SECRET', 'default-secret')
    refresh_secret = os.environ.get('JWT_REFRESH_SECRET', secret)
    payload = {'sub': str(user_id), 'jti': secrets.token_hex(8)}
    access_token = create_jwt(payload, secret, ACCESS_TOKEN_SECONDS)
    refresh_token = create_jwt({**payload, 'type': 'refresh'}, refresh_secret, REFRESH_TOKEN_SECONDS)
    client = get_redis_client()
    client.setex(f"auth-admin:refresh:{payload['jti']}", REFRESH_TOKEN_SECONDS, refresh_token)
    return {'access_token': access_token, 'refresh_token': refresh_token}


def refresh_token_flow(token: str) -> Dict[str, str]:
    refresh_secret = os.environ.get('JWT_REFRESH_SECRET', '')
    decoded = verify_jwt(token, refresh_secret)
    if not decoded or decoded.get('type') != 'refresh':
        return {}
    jti = decoded.get('jti')
    client = get_redis_client()
    stored = client.get(f"auth-admin:refresh:{jti}")
    if stored != token:
        return {}
    return generate_tokens(int(decoded.get('sub', '0')))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    identity = event.get('requestContext', {}).get('identity', {})
    ip_address = identity.get('sourceIp', 'unknown')
    user_agent = headers.get('user-agent', headers.get('User-Agent', 'unknown'))

    if method == 'OPTIONS':
        return cors_response(200)

    if method != 'POST':
        return response(405, {'error': 'Method not allowed'})

    if rate_limited(ip_address) or is_locked(ip_address):
        log_login_attempt(ip_address, user_agent, False)
        return response(429, {'error': 'Too many attempts'})

    payload = json.loads(event.get('body') or '{}')
    grant_type = payload.get('grant_type', 'password')

    if grant_type == 'refresh_token':
        tokens = refresh_token_flow(payload.get('refresh_token', ''))
        if not tokens:
            return response(401, {'error': 'Invalid refresh token'})
        return response(200, {'tokens': tokens})

    if not validate_captcha(payload):
        record_attempt(ip_address, False)
        log_login_attempt(ip_address, user_agent, False)
        return response(400, {'error': 'CAPTCHA validation failed'})

    password = payload.get('password', '')
    twofa_code = payload.get('twofa_code', '')

    if not password:
        return response(400, {'error': 'Password required'})

    password_hash = get_password_hash_from_db() or os.environ.get('ADMIN_PASSWORD_HASH', '')
    if not password_hash:
        return response(500, {'error': 'Admin password not configured'})

    valid_password = verify_password(password, password_hash)
    valid_twofa = validate_twofa(twofa_code)

    record_attempt(ip_address, valid_password and valid_twofa)
    log_login_attempt(ip_address, user_agent, valid_password and valid_twofa)

    if not valid_password or not valid_twofa:
        return response(401, {'error': 'Invalid credentials'})

    tokens = generate_tokens(2)
    return response(200, {'tokens': tokens})
