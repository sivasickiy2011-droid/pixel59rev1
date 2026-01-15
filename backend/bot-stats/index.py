import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение статистики и логов ботов из БД
    Args: event с httpMethod (GET/OPTIONS), queryStringParameters с limit, offset
    Returns: JSON со статистикой и списком логов
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 50))
        offset = int(params.get('offset', 0))
        
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
        
        cur.execute("""
            SELECT 
                COUNT(*) as total_attempts,
                COUNT(*) FILTER (WHERE is_blocked = true) as blocked_count,
                COUNT(*) FILTER (WHERE is_blocked = false) as allowed_count,
                COUNT(DISTINCT ip_address) as unique_ips
            FROM bot_logs
        """)
        stats = cur.fetchone()
        
        cur.execute(f"""
            SELECT 
                id,
                user_agent,
                is_blocked,
                ip_address,
                created_at
            FROM bot_logs
            ORDER BY created_at DESC
            LIMIT {limit} OFFSET {offset}
        """)
        
        logs = cur.fetchall()
        
        for log in logs:
            if log['created_at']:
                log['created_at'] = log['created_at'].isoformat()
        
        cur.execute("SELECT COUNT(*) as total FROM bot_logs")
        total = cur.fetchone()['total']
        
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
                'stats': {
                    'total_attempts': stats['total_attempts'],
                    'blocked_count': stats['blocked_count'],
                    'allowed_count': stats['allowed_count'],
                    'unique_ips': stats['unique_ips']
                },
                'logs': logs,
                'pagination': {
                    'total': total,
                    'limit': limit,
                    'offset': offset,
                    'has_more': offset + limit < total
                }
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