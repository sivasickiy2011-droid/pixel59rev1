import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, Any, List

from backend._shared.security import get_redis_client

cache: Dict[str, Any] = {}
cache_timestamp = None
CACHE_MINUTES = 5
PAGE_SIZE_DEFAULT = 12
REDIS_PREFIX = 'news-feed'
CDN_HOST = os.environ.get('CDN_HOST', '').rstrip('/')


def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not set')
    return psycopg2.connect(dsn)


def translate_image(image: str) -> str:
    if not image:
        return 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'
    if CDN_HOST and image.startswith('http'):
        return f"{CDN_HOST}{image[image.find('/', 8):]}"
    return image


def fetch_news_from_db(limit: int, offset: int, category: str | None, search: str | None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    clauses = ['is_active = TRUE']
    params: List[Any] = []

    if category:
        clauses.append('category = %s')
        params.append(category)
    if search:
        clauses.append('(COALESCE(translated_title, original_title) ILIKE %s OR COALESCE(translated_excerpt, original_excerpt) ILIKE %s)')
        search_param = f"%{search}%"
        params.extend([search_param, search_param])

    where = ' AND '.join(clauses)
    query = f"""SELECT id, COALESCE(translated_title, original_title) AS title, COALESCE(translated_excerpt, original_excerpt) AS excerpt,
                      COALESCE(translated_content, original_content) AS content, source, source_url AS sourceUrl,
                      link, image_url AS image, category, published_date
               FROM news
               WHERE {where}
               ORDER BY published_date DESC, display_order DESC
               LIMIT %s OFFSET %s"""
    params.extend([limit, offset])
    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    news_list = []
    months = {
        1: 'января', 2: 'февраля', 3: 'марта', 4: 'апреля',
        5: 'мая', 6: 'июня', 7: 'июля', 8: 'августа',
        9: 'сентября', 10: 'октября', 11: 'ноября', 12: 'декабря'
    }

    for row in rows:
        published = row['published_date']
        date_str = ''
        if published:
            date_str = f"{published.day} {months[published.month]} {published.year}"

        news_item = {
            'id': row['id'],
            'title': row['title'],
            'excerpt': row['excerpt'] or '',
            'content': row['content'] or '',
            'source': row['source'],
            'sourceUrl': row['sourceurl'],
            'link': row['link'],
            'image': translate_image(row['image']),
            'category': row['category'] or 'Веб-разработка',
            'date': date_str,
            'published_date': row['published_date'].isoformat() if row['published_date'] else None
        }
        news_list.append(news_item)

    return news_list


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    global cache, cache_timestamp

    method = event.get('httpMethod', 'GET')
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

    query_params = event.get('queryStringParameters') or {}
    page = int(query_params.get('page', 1))
    category = query_params.get('category')
    search = query_params.get('search')
    limit = int(query_params.get('limit', PAGE_SIZE_DEFAULT))
    offset = (page - 1) * limit

    redis_key = f"{REDIS_PREFIX}:{page}:{category or 'all'}:{search or 'all'}"
    redis_client = get_redis_client()
    cached_payload = redis_client.get(redis_key)
    if cached_payload:
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={CACHE_MINUTES * 60}'
            },
            'isBase64Encoded': False,
            'body': cached_payload
        }

    now = datetime.now()
    if cache_timestamp and (now - cache_timestamp) < timedelta(minutes=CACHE_MINUTES):
        corr_payload = json.dumps(cache)
        redis_client.setex(redis_key, CACHE_MINUTES * 60, corr_payload)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={CACHE_MINUTES * 60}'
            },
            'isBase64Encoded': False,
            'body': corr_payload
        }

    try:
        news = fetch_news_from_db(limit, offset, category, search)
        cache = {'news': news, 'page': page}
        cache_timestamp = datetime.now()
        payload = json.dumps(cache)
        redis_client.setex(redis_key, CACHE_MINUTES * 60, payload)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={CACHE_MINUTES * 60}'
            },
            'isBase64Encoded': False,
            'body': payload
        }
    except Exception as e:
        print(f'Error fetching news from DB: {e}')
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
