import json
import psycopg2
import os
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отслеживание посещений сайта
    Сохраняет информацию о визите в базу данных
    Args: event - данные о визите (page, referrer, userAgent и т.д.)
    Returns: JSON с результатом записи
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
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        
        page_path = body_data.get('page', '/')
        referrer = body_data.get('referrer', '')
        user_agent = body_data.get('userAgent', '')
        session_id = body_data.get('sessionId', '')
        is_admin = body_data.get('isAdmin', False)
        
        headers = event.get('headers', {})
        ip_address = headers.get('x-forwarded-for', headers.get('X-Forwarded-For', '')).split(',')[0].strip()
        
        device_type = 'desktop'
        if 'mobile' in user_agent.lower():
            device_type = 'mobile'
        elif 'tablet' in user_agent.lower():
            device_type = 'tablet'
        
        browser = 'unknown'
        if 'chrome' in user_agent.lower():
            browser = 'Chrome'
        elif 'firefox' in user_agent.lower():
            browser = 'Firefox'
        elif 'safari' in user_agent.lower():
            browser = 'Safari'
        elif 'edge' in user_agent.lower():
            browser = 'Edge'
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO site_visits 
            (visit_date, page_path, user_agent, referrer, session_id, ip_address, device_type, browser, is_admin)
            VALUES (CURRENT_DATE, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (page_path, user_agent, referrer, session_id, ip_address, device_type, browser, is_admin))
        
        if not is_admin:
            cur.execute("""
                INSERT INTO daily_stats (stat_date, total_visits, page_views)
                VALUES (CURRENT_DATE, 1, 1)
                ON CONFLICT (stat_date) DO UPDATE
                SET total_visits = daily_stats.total_visits + 1,
                    page_views = daily_stats.page_views + 1,
                    updated_at = CURRENT_TIMESTAMP
            """)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'message': 'Visit tracked'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error tracking visit: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }