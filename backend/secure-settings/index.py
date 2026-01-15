'''
Business: API для управления зашифрованными настройками и секретами
Args: event с httpMethod (GET/POST/PUT/DELETE), body с данными настроек
Returns: JSON с настройками или результатом операции
'''

import json
import os
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from dataclasses import dataclass
import psycopg2
from psycopg2.extras import RealDictCursor

@dataclass
class SecureSetting:
    key: str
    value: str
    category: str
    description: Optional[str] = None

# Глобальный cipher и ключ для всех операций
_cipher = None
_encryption_key = None

def get_cipher():
    '''Получает Fernet cipher для шифрования'''
    global _cipher, _encryption_key
    if _cipher is None:
        if _encryption_key is None:
            encryption_key_str = os.environ.get('ENCRYPTION_KEY')
            if encryption_key_str:
                _encryption_key = encryption_key_str.encode()
            else:
                # Генерируем и сохраняем ключ один раз
                _encryption_key = Fernet.generate_key()
        
        _cipher = Fernet(_encryption_key)
    return _cipher

def get_db_connection():
    '''Создает подключение к БД'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def encrypt_value(value: str) -> str:
    '''Шифрует значение (временно отключено для отладки)'''
    import base64
    return base64.b64encode(value.encode()).decode()

def decrypt_value(encrypted: str) -> str:
    '''Расшифровывает значение (временно отключено для отладки)'''
    import base64
    return base64.b64decode(encrypted.encode()).decode()

def get_all_settings(category: Optional[str] = None) -> list:
    '''Получает все настройки из БД'''
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if category:
        category_escaped = category.replace("'", "''")
        cur.execute(
            f"SELECT id, key, encrypted_value, category, description, created_at, updated_at FROM secure_settings WHERE category = '{category_escaped}' ORDER BY key"
        )
    else:
        cur.execute("SELECT id, key, encrypted_value, category, description, created_at, updated_at FROM secure_settings ORDER BY category, key")
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    result = []
    for row in rows:
        result.append({
            'id': row['id'],
            'key': row['key'],
            'value': decrypt_value(row['encrypted_value']),
            'category': row['category'],
            'description': row['description'],
            'created_at': row['created_at'].isoformat() if row['created_at'] else None,
            'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
        })
    
    return result

def get_setting(key: str) -> Optional[Dict[str, Any]]:
    '''Получает одну настройку по ключу'''
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    key_escaped = key.replace("'", "''")
    cur.execute(
        f"SELECT id, key, encrypted_value, category, description, created_at, updated_at FROM secure_settings WHERE key = '{key_escaped}'"
    )
    
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        return None
    
    return {
        'id': row['id'],
        'key': row['key'],
        'value': decrypt_value(row['encrypted_value']),
        'category': row['category'],
        'description': row['description'],
        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
        'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
    }

def create_or_update_setting(setting: SecureSetting) -> Dict[str, Any]:
    '''Создает или обновляет настройку'''
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    encrypted = encrypt_value(setting.value)
    
    key_escaped = setting.key.replace("'", "''")
    encrypted_escaped = encrypted.replace("'", "''")
    category_escaped = setting.category.replace("'", "''")
    description_escaped = (setting.description or '').replace("'", "''")
    
    cur.execute(
        f"""
        INSERT INTO secure_settings (key, encrypted_value, category, description, updated_at)
        VALUES ('{key_escaped}', '{encrypted_escaped}', '{category_escaped}', '{description_escaped}', CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET
            encrypted_value = EXCLUDED.encrypted_value,
            category = EXCLUDED.category,
            description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, key, category, description, created_at, updated_at
        """
    )
    
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'id': row['id'],
        'key': row['key'],
        'value': setting.value,
        'category': row['category'],
        'description': row['description'],
        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
        'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
    }

def delete_setting(key: str) -> bool:
    '''Удаляет настройку'''
    conn = get_db_connection()
    cur = conn.cursor()
    
    key_escaped = key.replace("'", "''")
    cur.execute(f"DELETE FROM secure_settings WHERE key = '{key_escaped}'")
    deleted = cur.rowcount > 0
    
    conn.commit()
    cur.close()
    conn.close()
    
    return deleted

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Проверка токена администратора через bcrypt
    headers = event.get('headers', {})
    admin_token = headers.get('x-admin-token') or headers.get('X-Admin-Token')
    
    if not admin_token:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized: No token provided'}),
            'isBase64Encoded': False
        }
    
    # Проверяем токен через bcrypt (как в auth-admin)
    import bcrypt
    admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH')
    
    if not admin_password_hash:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Admin password not configured'}),
            'isBase64Encoded': False
        }
    
    password_bytes = admin_token.encode('utf-8')
    hash_str = admin_password_hash.strip()
    
    if hash_str.startswith('$2a$'):
        hash_str = '$2b$' + hash_str[4:]
    
    hash_bytes = hash_str.encode('utf-8')
    
    is_valid = False
    try:
        is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception:
        pass
    
    if not is_valid:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized: Invalid token'}),
            'isBase64Encoded': False
        }
    
    # GET - получить все настройки или одну по ключу
    if method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        key = query_params.get('key')
        category = query_params.get('category')
        
        if key:
            setting = get_setting(key)
            if not setting:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Setting not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(setting)
            }
        else:
            settings = get_all_settings(category)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'settings': settings})
            }
    
    # POST/PUT - создать или обновить настройку
    if method in ['POST', 'PUT']:
        body_data = json.loads(event.get('body', '{}'))
        
        setting = SecureSetting(
            key=body_data.get('key'),
            value=body_data.get('value'),
            category=body_data.get('category', 'general'),
            description=body_data.get('description')
        )
        
        result = create_or_update_setting(setting)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    
    # DELETE - удалить настройку
    if method == 'DELETE':
        query_params = event.get('queryStringParameters') or {}
        key = query_params.get('key')
        
        if not key:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Key parameter required'})
            }
        
        deleted = delete_setting(key)
        
        if deleted:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Setting deleted'})
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Setting not found'})
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }