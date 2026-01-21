'''
Business: Save user consent data (cookies, terms, privacy) to database
Args: event with httpMethod, body containing consent data
Returns: HTTP response with success/error status
'''
import json
import os
import urllib.request
import time
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from _shared.db_secrets import get_secret
from _shared.security import (
    sanitize_text,
    is_valid_phone,
    is_valid_email,
    rate_limited,
    validate_origin,
    check_honeypot,
)
from _shared.logging import log_event
import threading

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
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
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Forbidden: Invalid origin'})
        }

    def _send_telegram(message_payload: dict):
        telegram_token = get_secret('TELEGRAM_BOT_TOKEN')
        telegram_chat = get_secret('TELEGRAM_CHAT_ID')
        if not telegram_token or not telegram_chat:
            return

        attempts = 0
        while attempts < 3:
            try:
                telegram_url = f'https://api.telegram.org/bot{telegram_token}/sendMessage'
                request_payload = {
                    'chat_id': telegram_chat,
                    'text': message_payload['text'],
                    'parse_mode': 'HTML'
                }
                req = urllib.request.Request(
                    telegram_url,
                    data=json.dumps(request_payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    result = json.loads(response.read().decode('utf-8'))
                    if result.get('ok'):
                        break
            except Exception as e:
                log_event('consent_telegram_retry_error', {'error': str(e), 'attempt': attempts + 1})
                time.sleep(attempts + 1)
            attempts += 1

    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            
            if check_honeypot(body_data):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Bot detected'})
                }

            ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
            if rate_limited(f'consent:{ip_address}', limit=10):
                return {
                    'statusCode': 429,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Rate limit exceeded'})
                }

            full_name = sanitize_text(body_data.get('fullName', 'Аноним'))
            phone = sanitize_text(body_data.get('phone', '')).strip() or None
            email = sanitize_text(body_data.get('email', '')).strip() or None
            cookies = body_data.get('cookies', False)
            terms = body_data.get('terms', False)
            privacy = body_data.get('privacy', False)
            
            # Если privacy не принято, разрешаем пустое full_name
            if privacy and not full_name:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Full name is required when privacy accepted'})
                }
            # Если full_name пустое, устанавливаем 'Аноним'
            if not full_name:
                full_name = 'Аноним'
            
            user_agent = event.get('headers', {}).get('user-agent', 'unknown')

            if phone and not is_valid_phone(phone):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Неверный формат телефона'})
                }

            if email and not is_valid_email(email):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Неверный формат email'})
                }
            
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                raise Exception('DATABASE_URL not configured')
            
            conn = psycopg2.connect(database_url)
            cur = conn.cursor()

            insert_query = '''
                INSERT INTO user_consents 
                (full_name, phone, email, cookies_accepted, terms_accepted, privacy_accepted, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            '''
            
            cur.execute(insert_query, (
                full_name,
                phone,
                email,
                cookies,
                terms,
                privacy,
                ip_address,
                user_agent
            ))
            
            result = cur.fetchone()
            consent_id = result[0] if result else None
            
            conn.commit()
            cur.close()
            conn.close()
            try:
                conn2 = psycopg2.connect(database_url)
                cur2 = conn2.cursor()
                cur2.execute('''
                    INSERT INTO user_consents_history 
                    (consent_id, full_name, phone, email, cookies_accepted, terms_accepted, privacy_accepted, ip_address, user_agent)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    consent_id,
                    full_name,
                    phone,
                    email,
                    cookies,
                    terms,
                    privacy,
                    ip_address,
                    user_agent
                ))
                conn2.commit()
                cur2.close()
                conn2.close()
            except Exception as e:
                log_event('consent_history_error', {'error': str(e), 'consent_id': consent_id})

            # Отправка уведомления в Telegram (не блокирующая, с коротким таймаутом)
            telegram_success = False
            try:
                telegram_message = f'''
✅ Новое согласие от пользователя
👤 Имя: {full_name}
📞 Телефон: {phone or 'не указан'}
📧 Email: {email or 'не указан'}
🍪 Cookies: {'да' if cookies else 'нет'}
📋 Terms: {'да' if terms else 'нет'}
🔐 Privacy: {'да' if privacy else 'нет'}
🌐 IP: {ip_address}
🆔 ID: {consent_id}
'''
                threading.Thread(target=_send_telegram, args=({'text': telegram_message},), daemon=True).start()
                telegram_success = True
            except Exception as e:
                log_event('consent_telegram_spawn_error', {'error': str(e)})
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'id': consent_id,
                    'telegram_sent': telegram_success
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'error': 'Internal server error',
                    'message': str(e)
                })
            }
    
    if method == 'GET':
        try:
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                raise Exception('DATABASE_URL not configured')
            
            conn = psycopg2.connect(database_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute('''
                SELECT id, full_name, phone, email, 
                       cookies_accepted, terms_accepted, privacy_accepted,
                       ip_address, created_at
                FROM user_consents
                ORDER BY created_at DESC
                LIMIT 100
            ''')
            
            consents = cur.fetchall()
            
            cur.close()
            conn.close()
            
            result = []
            for consent in consents:
                result.append({
                    'id': consent['id'],
                    'fullName': consent['full_name'],
                    'phone': consent['phone'],
                    'email': consent['email'],
                    'cookies': consent['cookies_accepted'],
                    'terms': consent['terms_accepted'],
                    'privacy': consent['privacy_accepted'],
                    'ipAddress': consent['ip_address'],
                    'createdAt': consent['created_at'].isoformat() if consent['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'consents': result})
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'error': 'Internal server error',
                    'message': str(e)
                })
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
