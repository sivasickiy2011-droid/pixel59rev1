import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

from backend._shared.logging import log_event
from backend._shared.security import (
    ensure_admin_authorized,
    enforce_rate_limit,
    sanitize_text,
    is_valid_image_url,
)

def require_admin(event: Dict[str, Any]) -> Dict[str, Any] | None:
    payload = ensure_admin_authorized(event.get('headers'))
    if not payload:
        return None
    if enforce_rate_limit('services-admin', event, limit=40, window_seconds=60):
        raise ValueError('rate_limit')
    return payload


def clean_input(value: str) -> str:
    return sanitize_text(value or '')


def require_admin(event: Dict[str, Any]) -> Dict[str, Any] | None:
    payload = ensure_admin_authorized(event.get('headers'))
    if not payload:
        return None
    if enforce_rate_limit('services-admin', event, limit=40, window_seconds=60):
        raise ValueError('rate_limit')
    return payload


def clean_input(value: str) -> str:
    return sanitize_text(value or '')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление услугами в админке (CRUD операции)
    Args: event с httpMethod (GET, POST, PUT, DELETE) и body с данными услуги
    Returns: Список услуг или результат операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    auth_payload = None
    try:
        auth_payload = require_admin(event)
        if not auth_payload:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
    except ValueError:
        return {
            'statusCode': 429,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Too many requests'}),
            'isBase64Encoded': False
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    try:
        body_str = event.get('body', '')
        body_data = json.loads(body_str) if body_str and body_str.strip() else {}
        sanitized = {k: sanitize_text(str(v)) if isinstance(v, str) else v for k, v in body_data.items()}
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            category = event.get('queryStringParameters', {}).get('category') if event.get('queryStringParameters') else None

            if category:
                cur.execute(
                    "SELECT * FROM services WHERE category = %s ORDER BY display_order ASC",
                    (category,)
                )
            else:
                cur.execute("SELECT * FROM services ORDER BY category, display_order ASC")

            services = cur.fetchall()
            
            cur.close()
            conn.close()

            services_list = []
            for service in services:
                services_list.append({
                    'id': service['id'],
                    'service_id': service['service_id'],
                    'category': service['category'],
                    'title': service['title'],
                    'description': service['description'],
                    'price': service['price'],
                    'is_active': service['is_active'],
                    'display_order': service['display_order'],
                    'created_at': str(service['created_at']),
                    'updated_at': str(service['updated_at']),
                    'image_url': service.get('image_url')
                })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'services': services_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            service_id = sanitized.get('service_id')
            category = sanitized.get('category')
            title = sanitized.get('title')
            description = sanitized.get('description')
            price = float(sanitized.get('price', 0) or 0)
            display_order = int(sanitized.get('display_order', 0) or 0)
            image_url = sanitized.get('image_url', '')
            
            if not all([service_id, category, title, description]):
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """INSERT INTO services (service_id, category, title, description, price, display_order, image_url)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (service_id, category, title, description, price, display_order, image_url if is_valid_image_url(image_url) else None)
            )
            
            new_id = cur.fetchone()['id']
            conn.commit()
            cur.close()
            conn.close()
            
            log_event('services-admin.create', {'service_id': service_id, 'user': auth_payload.get('sub')})
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'message': 'Service created', 'id': new_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            service_id = sanitized.get('service_id')
            if not service_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'service_id is required'}),
                    'isBase64Encoded': False
                }

            update_fields = []
            params = []

            if sanitized.get('title'):
                update_fields.append('title = %s')
                params.append(clean_input(sanitized['title']))
            if sanitized.get('description'):
                update_fields.append('description = %s')
                params.append(clean_input(sanitized['description']))
            if sanitized.get('price') is not None:
                update_fields.append('price = %s')
                params.append(float(sanitized['price']))
            if sanitized.get('is_active') is not None:
                update_fields.append('is_active = %s')
                params.append(bool(sanitized['is_active']))
            if sanitized.get('display_order') is not None:
                update_fields.append('display_order = %s')
                params.append(int(sanitized['display_order']))
            if sanitized.get('image_url') and is_valid_image_url(sanitized['image_url']):
                update_fields.append('image_url = %s')
                params.append(sanitized['image_url'])

            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.append(service_id)

            query = f"UPDATE services SET {', '.join(update_fields)} WHERE service_id = %s"
            cur.execute(query, tuple(params))
            log_event('services-admin.update', {'service_id': service_id, 'user': auth_payload.get('sub')})

            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Service updated'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            service_id = body_data.get('service_id')
            
            if not service_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'service_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("DELETE FROM services WHERE service_id = %s", (service_id,))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Service deleted'}),
                'isBase64Encoded': False
            }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
