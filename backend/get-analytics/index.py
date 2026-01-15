import json
import psycopg2
import os
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получение статистики посещений сайта
    Возвращает агрегированные данные по дням
    Args: event - параметры запроса (days - количество дней)
    Returns: JSON со статистикой
    '''
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
    
    try:
        params = event.get('queryStringParameters', {}) or {}
        days = int(params.get('days', '14'))
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                stat_date,
                total_visits,
                unique_visitors,
                page_views
            FROM daily_stats
            WHERE stat_date >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY stat_date ASC
        """ % days)
        
        rows = cur.fetchall()
        
        visits = []
        for row in rows:
            visits.append({
                'date': row[0].strftime('%Y-%m-%d'),
                'visits': row[1],
                'unique': row[2],
                'pageViews': row[3]
            })
        
        cur.execute("""
            SELECT COUNT(*), COUNT(DISTINCT session_id)
            FROM site_visits
            WHERE visit_date = CURRENT_DATE AND is_admin = FALSE
        """)
        today_row = cur.fetchone()
        today_visits = today_row[0] if today_row else 0
        today_unique = today_row[1] if today_row else 0
        
        cur.execute("""
            SELECT page_path, COUNT(*) as count
            FROM site_visits
            WHERE visit_date >= CURRENT_DATE - INTERVAL '%s days' AND is_admin = FALSE
            GROUP BY page_path
            ORDER BY count DESC
            LIMIT 10
        """ % days)
        
        pages_rows = cur.fetchall()
        top_pages = [{'page': row[0], 'views': row[1]} for row in pages_rows]
        
        cur.execute("""
            SELECT device_type, COUNT(*) as count
            FROM site_visits
            WHERE visit_date >= CURRENT_DATE - INTERVAL '%s days' AND is_admin = FALSE
            GROUP BY device_type
        """ % days)
        
        devices_rows = cur.fetchall()
        devices = [{'type': row[0], 'count': row[1]} for row in devices_rows]
        
        cur.execute("""
            SELECT browser, COUNT(*) as count
            FROM site_visits
            WHERE visit_date >= CURRENT_DATE - INTERVAL '%s days' AND is_admin = FALSE
            GROUP BY browser
            ORDER BY count DESC
        """ % days)
        
        browsers_rows = cur.fetchall()
        browsers = [{'name': row[0], 'count': row[1]} for row in browsers_rows]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'visits': visits,
                'today': {
                    'visits': today_visits,
                    'unique': today_unique
                },
                'topPages': top_pages,
                'devices': devices,
                'browsers': browsers
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f'Error getting analytics: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }