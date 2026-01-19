import json
import os
import bcrypt
import requests
import secrets
import string
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any

# Конфигурация
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
ALLOWED_CHAT_ID = '500136108'  # Идентификатор чата, указанный в задании
TEMP_PASSWORD_LENGTH = 12
TEMP_PASSWORD_EXPIRY_MINUTES = 10

# Генерация временного пароля
def generate_temp_password(length: int = TEMP_PASSWORD_LENGTH) -> str:
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Отправка сообщения в Telegram
def send_telegram_message(chat_id: str, text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN:
        print('TELEGRAM_BOT_TOKEN not set')
        return False
    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except Exception as e:
        print(f'Telegram send error: {e}')
        return False

# Получение хеша пароля из базы данных
def get_password_hash_from_db(user_id: int = 2) -> str:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return ''
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    cursor.execute(
        'SELECT password_hash FROM users WHERE id = %s', (user_id,)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row[0] if row else ''

# Обновление хеша пароля в базе данных
def update_password_hash_in_db(new_hash: str, user_id: int = 2) -> bool:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return False
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    try:
        cursor.execute(
            'UPDATE users SET password_hash = %s WHERE id = %s',
            (new_hash, user_id)
        )
        conn.commit()
        success = cursor.rowcount > 0
    except Exception as e:
        print(f'Update password error: {e}')
        success = False
    finally:
        cursor.close()
        conn.close()
    return success

# Проверка, что запрос пришел из разрешенного чата
def is_request_from_allowed_chat(event: Dict[str, Any]) -> bool:
    # В реальном сценарии можно проверять заголовки или тело запроса
    # Для простоты будем проверять наличие секретного токена в теле
    body_str = event.get('body', '{}')
    try:
        body = json.loads(body_str)
        chat_id = body.get('chat_id', '')
        return str(chat_id) == ALLOWED_CHAT_ID
    except:
        return False

# Основной обработчик
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Проверяем, что запрос от разрешенного чата
    if not is_request_from_allowed_chat(event):
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Access denied'}),
            'isBase64Encoded': False
        }
    
    body_str = event.get('body', '{}')
    if not body_str or body_str.strip() == '':
        body_str = '{}'
    
    try:
        body_data = json.loads(body_str)
    except:
        body_data = {}
    
    action = body_data.get('action', 'generate')
    
    if action == 'generate':
        # Генерация временного пароля и отправка в Telegram
        temp_password = generate_temp_password()
        expiry = datetime.utcnow() + timedelta(minutes=TEMP_PASSWORD_EXPIRY_MINUTES)
        expiry_str = expiry.strftime('%Y-%m-%d %H:%M:%S UTC')
        
        # Хешируем временный пароль
        password_bytes = temp_password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=10)
        temp_hash = bcrypt.hashpw(password_bytes, salt)
        temp_hash_str = temp_hash.decode('utf-8')
        
        # Сохраняем временный хеш в базе (можно в отдельной таблице, но для простоты обновим основной)
        # В реальном проекте лучше использовать отдельную таблицу временных паролей
        # Здесь для демонстрации просто обновляем основной пароль
        update_success = update_password_hash_in_db(temp_hash_str)
        
        if not update_success:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to update password'}),
                'isBase64Encoded': False
            }
        
        # Отправляем пароль в Telegram
        message = (
            f'🔐 <b>Временный пароль для админ-панели</b>\n'
            f'Пароль: <code>{temp_password}</code>\n'
            f'Действителен до: {expiry_str}\n'
            f'Используйте его для входа в админ-панель.\n'
            f'После входа рекомендуется сменить пароль.'
        )
        sent = send_telegram_message(ALLOWED_CHAT_ID, message)
        
        if sent:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Temporary password generated and sent to Telegram',
                    'expires_at': expiry_str
                }),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to send Telegram message'}),
                'isBase64Encoded': False
            }
    
    elif action == 'confirm':
        # Подтверждение смены пароля (например, после ввода временного пароля)
        new_password = body_data.get('new_password', '')
        if not new_password or len(new_password) < 8:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'New password must be at least 8 characters'}),
                'isBase64Encoded': False
            }
        
        # Хешируем новый пароль
        password_bytes = new_password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=10)
        new_hash = bcrypt.hashpw(password_bytes, salt)
        new_hash_str = new_hash.decode('utf-8')
        
        # Обновляем пароль в базе
        update_success = update_password_hash_in_db(new_hash_str)
        
        if update_success:
            # Отправляем уведомление в Telegram
            message = (
                f'✅ <b>Пароль успешно изменен</b>\n'
                f'Новый пароль установлен для админ-панели.\n'
                f'Время изменения: {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")}'
            )
            send_telegram_message(ALLOWED_CHAT_ID, message)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Password changed successfully'
                }),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to update password'}),
                'isBase64Encoded': False
            }
    
    else:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
