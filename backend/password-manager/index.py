import json
import os
import bcrypt
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление паролями администратора
    Business: Единая функция для всех операций с паролями - смена, тестирование, экстренный сброс
    Args: event - dict с httpMethod, queryStringParameters.action (change/test/emergency_reset), body с паролями
          context - объект с request_id
    Returns: HTTP response с результатом операции или новым хешем пароля
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
    
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', 'change')
    
    body_str = event.get('body', '{}')
    if not body_str or body_str.strip() == '':
        body_str = '{}'
    body_data = json.loads(body_str)
    
    # ACTION: emergency_reset - экстренный сброс без проверки старого пароля
    if action == 'emergency_reset':
        new_password = body_data.get('new_password', '')
        
        if not new_password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'New password required'}),
                'isBase64Encoded': False
            }
        
        if len(new_password) < 8:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Password must be at least 8 characters'}),
                'isBase64Encoded': False
            }
        
        new_password_bytes = new_password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=10)
        new_hash = bcrypt.hashpw(new_password_bytes, salt)
        new_hash_str = new_hash.decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'New password hash generated',
                'new_hash': new_hash_str,
                'instructions': 'Copy this hash and update ADMIN_PASSWORD_HASH secret'
            }),
            'isBase64Encoded': False
        }
    
    # ACTION: test - тестирование пароля против хеша
    if action == 'test':
        password = body_data.get('password', '')
        
        if not password:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Password required'}),
                'isBase64Encoded': False
            }
        
        admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH', '')
        
        if not admin_password_hash:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'ADMIN_PASSWORD_HASH not set'}),
                'isBase64Encoded': False
            }
        
        password_bytes = password.encode('utf-8')
        hash_str = admin_password_hash.strip()
        
        # Convert $2a$ to $2b$ if needed
        original_hash = hash_str
        if hash_str.startswith('$2a$'):
            hash_str = '$2b$' + hash_str[4:]
        
        hash_bytes = hash_str.encode('utf-8')
        
        is_valid = False
        error_msg = None
        try:
            is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
        except Exception as e:
            error_msg = str(e)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'password_length': len(password),
                'hash_prefix': original_hash[:15] if len(original_hash) >= 15 else original_hash,
                'hash_length': len(original_hash),
                'hash_converted': original_hash != hash_str,
                'password_matches': is_valid,
                'error': error_msg,
                'hash_format_valid': original_hash.startswith('$2a$') or original_hash.startswith('$2b$')
            }),
            'isBase64Encoded': False
        }
    
    # ACTION: change (default) - смена пароля с проверкой текущего
    current_password = body_data.get('current_password', '')
    new_password = body_data.get('new_password', '')
    
    if not current_password or not new_password:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Current and new passwords required'}),
            'isBase64Encoded': False
        }
    
    if len(new_password) < 8:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'New password must be at least 8 characters'}),
            'isBase64Encoded': False
        }
    
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
    
    current_password_bytes = current_password.encode('utf-8')
    hash_bytes = admin_password_hash.encode('utf-8')
    
    if not bcrypt.checkpw(current_password_bytes, hash_bytes):
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Current password is incorrect'}),
            'isBase64Encoded': False
        }
    
    new_password_bytes = new_password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=10)
    new_hash = bcrypt.hashpw(new_password_bytes, salt)
    new_hash_str = new_hash.decode('utf-8')
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'message': 'Password changed successfully',
            'new_hash': new_hash_str
        }),
        'isBase64Encoded': False
    }
