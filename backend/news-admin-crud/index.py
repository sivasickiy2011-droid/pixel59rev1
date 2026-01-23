"""
News CRUD API
Business: Управление новостями - получение списка для админки и CRUD операции
Args: event - dict with httpMethod, body, headers, queryStringParameters
      context - object with request_id, function_name attributes
Returns: HTTP response dict with statusCode, headers, body
"""

import json
import os
import psycopg2
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend._shared.logging import log_event
from backend._shared.security import (
    ensure_admin_authorized,
    enforce_rate_limit,
    sanitize_text,
    is_valid_image_url,
)
def get_db_connection():
    """Create database connection"""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(dsn)

def get_all_news() -> List[Dict[str, Any]]:
    """Get all news sorted by published_date descending"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    id,
                    original_title,
                    translated_title,
                    original_excerpt,
                    translated_excerpt,
                    original_content,
                    translated_content,
                    source,
                    source_url,
                    link,
                    image_url,
                    category,
                    published_date,
                    is_active,
                    created_at,
                    updated_at,
                    translated_at
                FROM public.news
                ORDER BY published_date DESC, created_at DESC
            """)
            
            columns = [desc[0] for desc in cur.description]
            news_list = []
            for row in cur.fetchall():
                news_item = dict(zip(columns, row))
                # Convert datetime objects to ISO strings
                for date_field in ['published_date', 'created_at', 'updated_at', 'translated_at']:
                    if news_item.get(date_field) and isinstance(news_item[date_field], datetime):
                        news_item[date_field] = news_item[date_field].isoformat()
                news_list.append(news_item)
            
            return news_list
    finally:
        conn.close()

def create_news(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new news item"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.news
                (original_title, translated_title, original_excerpt, translated_excerpt,
                 original_content, translated_content, source, source_url, link, image_url,
                 category, published_date, is_active, translated_at, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id, original_title, translated_title, original_excerpt, translated_excerpt,
                          original_content, translated_content, source, source_url, link, image_url,
                          category, published_date, is_active, created_at, updated_at, translated_at
            """, (
                data.get('original_title', ''),
                data.get('translated_title', ''),
                data.get('original_excerpt', ''),
                data.get('translated_excerpt', ''),
                data.get('original_content', ''),
                data.get('translated_content', ''),
                data.get('source', ''),
                data.get('source_url', ''),
                data.get('link', ''),
                data.get('image_url', ''),
                data.get('category', 'Технологии'),
                data.get('published_date', datetime.now().isoformat()),
                data.get('is_active', True)
            ))
            
            conn.commit()
            
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            news_item = dict(zip(columns, row))
            # Convert datetime objects
            for date_field in ['published_date', 'created_at', 'updated_at', 'translated_at']:
                if news_item.get(date_field) and isinstance(news_item[date_field], datetime):
                    news_item[date_field] = news_item[date_field].isoformat()
            
            return news_item
    finally:
        conn.close()

def update_news(news_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update news item"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE public.news
                SET original_title = %s, translated_title = %s,
                    original_excerpt = %s, translated_excerpt = %s,
                    original_content = %s, translated_content = %s,
                    source = %s, source_url = %s, link = %s,
                    image_url = %s, category = %s, published_date = %s,
                    is_active = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, original_title, translated_title, original_excerpt, translated_excerpt,
                          original_content, translated_content, source, source_url, link, image_url,
                          category, published_date, is_active, created_at, updated_at, translated_at
            """, (
                data.get('original_title', ''),
                data.get('translated_title', ''),
                data.get('original_excerpt', ''),
                data.get('translated_excerpt', ''),
                data.get('original_content', ''),
                data.get('translated_content', ''),
                data.get('source', ''),
                data.get('source_url', ''),
                data.get('link', ''),
                data.get('image_url', ''),
                data.get('category', 'Технологии'),
                data.get('published_date', datetime.now().isoformat()),
                data.get('is_active', True),
                news_id
            ))
            
            conn.commit()
            
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            if not row:
                return None
            
            news_item = dict(zip(columns, row))
            # Convert datetime objects
            for date_field in ['published_date', 'created_at', 'updated_at', 'translated_at']:
                if news_item.get(date_field) and isinstance(news_item[date_field], datetime):
                    news_item[date_field] = news_item[date_field].isoformat()
            
            return news_item
    finally:
        conn.close()

def patch_news(news_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """Partial update (e.g., toggle is_active)"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Build dynamic SET clause
            set_clauses = []
            values = []
            for key, value in data.items():
                if key == 'is_active':
                    set_clauses.append(f"{key} = %s")
                    values.append(value)
            
            if not set_clauses:
                return None
            
            values.append(news_id)
            set_clause_str = ', '.join(set_clauses)
            
            cur.execute(f"""
                UPDATE public.news
                SET {set_clause_str}, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, original_title, translated_title, is_active
            """, tuple(values))
            
            conn.commit()
            
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            if not row:
                return None
            
            news_item = dict(zip(columns, row))
            return news_item
    finally:
        conn.close()

def delete_news(news_id: int) -> bool:
    """Delete news item"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM public.news
                WHERE id = %s
            """, (news_id,))
            
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

def require_admin(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    payload = ensure_admin_authorized(event.get('headers'))
    if not payload:
        return None
    if enforce_rate_limit('news-admin-crud', event, limit=30, window_seconds=60):
        raise ValueError('rate_limit')
    return payload


def validate_text(value: str, default: str = '') -> str:
    return sanitize_text(value or default)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    try:
        auth_payload = require_admin(event)
        if not auth_payload:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
    except ValueError as exc:
        return {
            'statusCode': 429,
            'headers': headers,
            'body': json.dumps({'error': 'Too many requests'}),
            'isBase64Encoded': False
        }

    try:
        if method == 'GET':
            news = get_all_news()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(news),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            body_data = {k: sanitize_text(str(v)) if isinstance(v, str) else v for k, v in body_data.items()}
            news_item = create_news(body_data)
            log_event('news-admin-crud.create', {'id': news_item.get('id'), 'user': auth_payload.get('sub')})
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(news_item),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            news_id = body_data.get('id')

            if not news_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'News ID is required'}),
                    'isBase64Encoded': False
                }
            
            news_item = update_news(news_id, body_data)
            
            if not news_item:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'News not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(news_item),
                'isBase64Encoded': False
            }
        
        elif method == 'PATCH':
            body_data = json.loads(event.get('body', '{}'))
            news_id = body_data.get('id')
            
            if not news_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'News ID is required'}),
                    'isBase64Encoded': False
                }
            
            news_item = patch_news(news_id, body_data)
            
            if not news_item:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'News not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(news_item),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            news_id = body_data.get('id')
            
            if not news_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'News ID is required'}),
                    'isBase64Encoded': False
                }
            
            deleted = delete_news(news_id)
            
            if not deleted:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'News not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
