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
    
    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            
            full_name = body_data.get('fullName', '').strip()
            phone = body_data.get('phone', '').strip() or None
            email = body_data.get('email', '').strip() or None
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
            
            request_context = event.get('requestContext', {})
            ip_address = request_context.get('identity', {}).get('sourceIp', 'unknown')
            user_agent = event.get('headers', {}).get('user-agent', 'unknown')
            
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
            
            # Отправка уведомления в Telegram (не блокирующая, с коротким таймаутом)
            telegram_success = False
            try:
                telegram_bot_token = get_secret('TELEGRAM_BOT_TOKEN')
                telegram_chat_id = get_secret('TELEGRAM_CHAT_ID')
                if telegram_bot_token and telegram_chat_id:
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
                    telegram_url = f'https://api.telegram.org/bot{telegram_bot_token}/sendMessage'
                    telegram_data = {
                        'chat_id': telegram_chat_id,
                        'text': telegram_message,
                        'parse_mode': 'HTML'
                    }
                    # Уменьшаем таймаут до 3 секунд
                    telegram_request = urllib.request.Request(
                        telegram_url,
                        data=json.dumps(telegram_data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'}
                    )
                    # Используем socket timeout и общий timeout
                    import socket
                    socket.setdefaulttimeout(3.0)
                    with urllib.request.urlopen(telegram_request, timeout=3) as response:
                        telegram_result = json.loads(response.read().decode('utf-8'))
                        telegram_success = telegram_result.get('ok', False)
            except urllib.error.URLError as e:
                print(f'Telegram URL error (timeout?): {str(e)}')
                # Не критично, просто не отправлено
            except Exception as e:
                print(f'Telegram error: {str(e)}')
                # Игнорируем ошибку, чтобы не влиять на сохранение согласия
            
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
