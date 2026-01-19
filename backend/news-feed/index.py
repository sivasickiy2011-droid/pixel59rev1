import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, Any, List

cache: Dict[str, Any] = {}
cache_timestamp = None
CACHE_MINUTES = 5  # короткое кэширование на 5 минут для снижения нагрузки на БД

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not set')
    return psycopg2.connect(dsn)

def fetch_news_from_db(limit: int = 12) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """SELECT 
               id,
               COALESCE(translated_title, original_title) as title,
               COALESCE(translated_excerpt, original_excerpt) as excerpt,
               COALESCE(translated_content, original_content) as content,
               source,
               source_url as sourceUrl,
               link,
               image_url as image,
               category,
               published_date,
               translated_at,
               DATE(published_date) as date_only
           FROM news 
           WHERE is_active = TRUE 
           ORDER BY published_date DESC 
           LIMIT %s""",
        (limit,)
    )
    
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    news_list = []
    for row in rows:
        # Форматирование даты в русский формат
        date_str = ''
        if row['published_date']:
            try:
                date_obj = row['published_date']
                months = {
                    1: 'января', 2: 'февраля', 3: 'марта', 4: 'апреля',
                    5: 'мая', 6: 'июня', 7: 'июля', 8: 'августа',
                    9: 'сентября', 10: 'октября', 11: 'ноября', 12: 'декабря'
                }
                date_str = f"{date_obj.day} {months[date_obj.month]} {date_obj.year}"
            except:
                date_str = row['published_date'].strftime('%d.%m.%Y')
        
        news_item = {
            'title': row['title'],
            'excerpt': row['excerpt'] or '',
            'content': row['content'] or '',
            'source': row['source'],
            'sourceUrl': row['sourceurl'],
            'link': row['link'],
            'image': row['image'] or 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
            'category': row['category'] or 'Веб-разработка',
            'date': date_str,
            'id': row['id']
        }
        news_list.append(news_item)
    
    return news_list

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение последних новостей из базы данных с кешированием на 5 минут
    Args: event с httpMethod (GET/OPTIONS)
    Returns: JSON с массивом новостей
    '''
    global cache, cache_timestamp
    
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
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    now = datetime.now()
    if cache_timestamp and (now - cache_timestamp) < timedelta(minutes=CACHE_MINUTES):
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={CACHE_MINUTES * 60}'
            },
            'isBase64Encoded': False,
            'body': json.dumps(cache)
        }
    
    try:
        news = fetch_news_from_db(limit=12)
        cache = {'news': news}
        cache_timestamp = datetime.now()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={CACHE_MINUTES * 60}'
            },
            'isBase64Encoded': False,
            'body': json.dumps(cache)
        }
    except Exception as e:
        print(f'Error fetching news from DB: {e}')
        # Fallback: вернуть пустой массив
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'news': []})
        }