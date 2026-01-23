import json
import os
import psycopg2
from typing import Dict, Any, Optional

from backend._shared.security import ensure_admin_authorized, enforce_rate_limit


def require_admin(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    payload = ensure_admin_authorized(event.get('headers'))
    if not payload:
        return None
    if enforce_rate_limit('admin-partner-logos', event, limit=40, window_seconds=60):
        raise ValueError('rate_limit')
    return payload

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin CRUD operations for partner logos
    Args: event with httpMethod, body
    Returns: HTTP response with partner logo data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
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

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute('''
            SELECT id, name, logo_url, website, sort_order, is_active, created_at
            FROM partners
            ORDER BY sort_order ASC
        ''')
        rows = cur.fetchall()
        
        partners = []
        for row in rows:
            partners.append({
                'id': row[0],
                'name': row[1],
                'logo_url': row[2],
                'website_url': row[3],
                'display_order': row[4],
                'is_active': row[5],
                'created_at': row[6].isoformat() if row[6] else None
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(partners),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        name = body.get('name')
        logo_url = body.get('logo_url')
        website_url = body.get('website_url')
        display_order = body.get('display_order', 0)
        is_active = body.get('is_active', True)
        
        if not name or not logo_url or not website_url:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Name, logo_url and website_url are required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            INSERT INTO partners
            (name, logo_url, website, sort_order, is_active)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, logo_url, website, sort_order, is_active, created_at
        ''', (name, logo_url, website_url, display_order, is_active))
        
        row = cur.fetchone()
        conn.commit()
        
        partner = {
            'id': row[0],
            'name': row[1],
            'logo_url': row[2],
            'website_url': row[3],
            'display_order': row[4],
            'is_active': row[5],
            'created_at': row[6].isoformat() if row[6] else None
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(partner),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body = json.loads(event.get('body', '{}'))
        partner_id = body.get('id')
        
        if not partner_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Partner ID is required'}),
                'isBase64Encoded': False
            }
        
        updates = []
        values = []
        
        if 'name' in body:
            updates.append('name = %s')
            values.append(body['name'])
        if 'logo_url' in body:
            updates.append('logo_url = %s')
            values.append(body['logo_url'])
        if 'website_url' in body:
            updates.append('website = %s')
            values.append(body['website_url'])
        if 'display_order' in body:
            updates.append('sort_order = %s')
            values.append(body['display_order'])
        if 'is_active' in body:
            updates.append('is_active = %s')
            values.append(body['is_active'])
        values.append(partner_id)
        
        query = f'''
            UPDATE partners
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, name, logo_url, website, sort_order, is_active, created_at
        '''
        
        cur.execute(query, values)
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Partner not found'}),
                'isBase64Encoded': False
            }
        
        partner = {
            'id': row[0],
            'name': row[1],
            'logo_url': row[2],
            'website_url': row[3],
            'display_order': row[4],
            'is_active': row[5],
            'created_at': row[6].isoformat() if row[6] else None
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(partner),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE':
        query_params = event.get('queryStringParameters', {})
        partner_id = query_params.get('id') if query_params else None
        
        if not partner_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Partner ID is required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            DELETE FROM partners
            WHERE id = %s
            RETURNING id
        ''', (partner_id,))
        
        row = cur.fetchone()
        conn.commit()
        
        cur.close()
        conn.close()
        
        if not row:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Partner not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'deleted_id': row[0]}),
            'isBase64Encoded': False
        }
    
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
