import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get admin login logs history
    Args: event with httpMethod, queryStringParameters for pagination
          context with request_id
    Returns: HTTP response with login logs
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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    limit = int(query_params.get('limit', '50'))
    offset = int(query_params.get('offset', '0'))
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT COUNT(*) FROM admin_login_logs"
    )
    total_count = cursor.fetchone()[0]
    
    cursor.execute(
        """
        SELECT id, ip_address, user_agent, success, created_at
        FROM admin_login_logs
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
        """,
        (limit, offset)
    )
    
    rows = cursor.fetchall()
    
    logs: List[Dict[str, Any]] = []
    for row in rows:
        logs.append({
            'id': row[0],
            'ip_address': row[1],
            'user_agent': row[2],
            'success': row[3],
            'created_at': row[4].isoformat() if row[4] else None
        })
    
    cursor.execute(
        "SELECT COUNT(*) FROM admin_login_logs WHERE success = true"
    )
    success_count = cursor.fetchone()[0]
    
    cursor.execute(
        "SELECT COUNT(*) FROM admin_login_logs WHERE success = false"
    )
    failed_count = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'logs': logs,
            'stats': {
                'total_attempts': total_count,
                'success_count': success_count,
                'failed_count': failed_count
            },
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset,
                'has_more': offset + limit < total_count
            }
        }),
        'isBase64Encoded': False
    }
