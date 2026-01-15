import json
import os
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Логирование попыток доступа ботов с сохранением в БД
    Args: event с httpMethod (POST/OPTIONS), body с user_agent, is_blocked
    Returns: JSON с результатом логирования
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
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        user_agent: str = body_data.get('user_agent', 'Unknown')
        is_blocked: bool = body_data.get('is_blocked', False)
        ip_address: str = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'Unknown')
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'DATABASE_URL not configured'})
            }
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        user_agent_escaped = user_agent.replace("'", "''")
        ip_address_escaped = ip_address.replace("'", "''")
        timestamp = datetime.utcnow().isoformat()
        
        cur.execute(
            f"INSERT INTO bot_logs (user_agent, is_blocked, ip_address, created_at) VALUES ('{user_agent_escaped}', {is_blocked}, '{ip_address_escaped}', '{timestamp}') RETURNING id"
        )
        
        result = cur.fetchone()
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'log_id': result['id'],
                'is_blocked': is_blocked
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }