import json
import os
import bcrypt
import psycopg2
from typing import Dict, Any

def log_login_attempt(ip_address: str, user_agent: str, success: bool) -> None:
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    ip_address_escaped = ip_address.replace("'", "''")
    user_agent_escaped = user_agent.replace("'", "''")
    
    cursor.execute(
        f"INSERT INTO admin_login_logs (ip_address, user_agent, success) VALUES ('{ip_address_escaped}', '{user_agent_escaped}', {success})"
    )
    
    conn.commit()
    cursor.close()
    conn.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Authenticate admin user with password and log attempt
    Args: event with httpMethod, body containing password, headers, requestContext
          context with request_id
    Returns: HTTP response with auth token or error
    '''
    method: str = event.get('httpMethod', 'GET')
    
    request_context = event.get('requestContext', {})
    identity = request_context.get('identity', {})
    ip_address = identity.get('sourceIp', 'unknown')
    
    headers = event.get('headers', {})
    user_agent = headers.get('user-agent', headers.get('User-Agent', 'unknown'))
    
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
    
    body_str = event.get('body', '{}')
    if not body_str or body_str.strip() == '':
        body_str = '{}'
    
    body_data = json.loads(body_str)
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
    
    password_bytes = password.encode('utf-8')
    hash_str = admin_password_hash.strip()
    
    if hash_str.startswith('$2a$'):
        hash_str = '$2b$' + hash_str[4:]
    
    hash_bytes = hash_str.encode('utf-8')
    
    print(f"Debug: Checking password against hash starting with: {hash_str[:10]}")
    
    is_valid = False
    try:
        is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
        print(f"Debug: Password check result: {is_valid}")
    except Exception as e:
        print(f"Password check error: {e}")
    
    log_login_attempt(ip_address, user_agent, is_valid)
    
    if is_valid:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Authentication successful'
            }),
            'isBase64Encoded': False
        }
    else:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid password'}),
            'isBase64Encoded': False
        }