import json
import os
import urllib.request
from typing import Dict, Any
import psycopg2
import base64

from _shared.security import (
    sanitize_text,
    is_valid_phone,
    is_valid_email,
    rate_limited,
    validate_origin,
    check_honeypot,
)
from _shared.logging import log_event

_secret_cache = {}

def get_secret(key: str) -> str:
    '''Reads secret from database with caching'''
    if key in _secret_cache:
        return _secret_cache[key]
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        key_escaped = key.replace("'", "''")
        cur.execute(f"SELECT encrypted_value FROM secure_settings WHERE key = '{key_escaped}'")
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if row:
            value = base64.b64decode(row[0].encode()).decode()
            _secret_cache[key] = value
            return value
    except Exception as e:
        print(f'DB secret read error for {key}: {str(e)}')
    
    env_value = os.environ.get(key, '')
    _secret_cache[key] = env_value
    return env_value


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обработка контактной формы и отправка в Битрикс24 + Telegram
    Args: event с httpMethod, body (JSON с полями: name, phone, type)
          context с request_id
    Returns: HTTP response с результатом отправки
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    headers = event.get('headers', {})
    origin = headers.get('origin', headers.get('Origin', ''))
    referer = headers.get('referer', headers.get('Referer', ''))

    if not validate_origin(origin) and not validate_origin(referer):
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Forbidden: Invalid origin'})
        }

    body_data = json.loads(event.get('body', '{}'))

    if check_honeypot(body_data):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Bot detected'})
        }

    ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    if rate_limited(f'contact-form:{ip_address}'):
        return {
            'statusCode': 429,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Rate limit exceeded'})
        }

    name: str = sanitize_text(body_data.get('name', 'Не указано'))
    phone: str = sanitize_text(body_data.get('phone', 'Не указано'))
    email: str = sanitize_text(body_data.get('email', ''))
    form_type: str = sanitize_text(body_data.get('type', 'contact_form'))
    timestamp: str = sanitize_text(body_data.get('timestamp', ''))

    if not is_valid_phone(phone):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный формат телефона'})
        }

    if email and not is_valid_email(email):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный формат email'})
        }
    
    # Битрикс24
    bitrix_webhook = get_secret('BITRIX24_WEBHOOK_URL') or get_secret('bitrix24_webhook_url') or ''
    
    bitrix_success = False
    if bitrix_webhook:
        try:
            bitrix_data = {
                'TITLE': f'Обратная связь: {name}',
                'NAME': name,
                'PHONE': [{'VALUE': phone, 'VALUE_TYPE': 'WORK'}],
                'COMMENTS': f'📝 Форма: {form_type}\n🕐 Время: {timestamp}',
                'SOURCE_ID': 'WEB'
            }
            
            bitrix_url = f'{bitrix_webhook}crm.lead.add.json'
            bitrix_request = urllib.request.Request(
                bitrix_url,
                data=json.dumps({'fields': bitrix_data}).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(bitrix_request, timeout=10) as response:
                bitrix_result = json.loads(response.read().decode('utf-8'))
                bitrix_success = bitrix_result.get('result', False)
        except Exception as e:
            log_event('contact_form_bitrix_error', {'error': str(e), 'body': body_data})
    
    # Telegram
    telegram_success = False
    telegram_bot_token = get_secret('TELEGRAM_BOT_TOKEN') or ''
    telegram_chat_id = get_secret('TELEGRAM_CHAT_ID') or ''
    
    if telegram_bot_token and telegram_chat_id:
        try:
            telegram_message = f'''
🆕 Новая заявка с сайта

👤 Имя: {name}
📞 Телефон: {phone}

📝 Тип формы: {form_type}
🕐 Время: {timestamp}
'''
            
            telegram_url = f'https://api.telegram.org/bot{telegram_bot_token}/sendMessage'
            telegram_data = {
                'chat_id': telegram_chat_id,
                'text': telegram_message
            }
            
            telegram_request = urllib.request.Request(
                telegram_url,
                data=json.dumps(telegram_data).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(telegram_request, timeout=10) as response:
                telegram_result = json.loads(response.read().decode('utf-8'))
                telegram_success = telegram_result.get('ok', False)
        except Exception as e:
            log_event('contact_form_telegram_error', {'error': str(e), 'body': body_data})
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'bitrix24': bitrix_success,
            'telegram': telegram_success,
            'message': 'Заявка отправлена'
        })
    }
