import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

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
    
    try:
        body_str = event.get('body', '')
        if not body_str or body_str.strip() == '':
            body_data = {}
        else:
            body_data = json.loads(body_str)
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            category = event.get('queryStringParameters', {}).get('category') if event.get('queryStringParameters') else None
            
            if category:
                category_escaped = category.replace("'", "''")
                cur.execute(
                    f"SELECT * FROM services WHERE category = '{category_escaped}' ORDER BY display_order ASC"
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
                    'updated_at': str(service['updated_at'])
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'services': services_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            service_id = body_data.get('service_id')
            category = body_data.get('category')
            title = body_data.get('title')
            description = body_data.get('description')
            price = body_data.get('price', 0)
            display_order = body_data.get('display_order', 0)
            
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
            
            service_id_escaped = service_id.replace("'", "''")
            category_escaped = category.replace("'", "''")
            title_escaped = title.replace("'", "''")
            description_escaped = description.replace("'", "''")
            
            cur.execute(
                f"""INSERT INTO services (service_id, category, title, description, price, display_order)
                   VALUES ('{service_id_escaped}', '{category_escaped}', '{title_escaped}', '{description_escaped}', {price}, {display_order}) RETURNING id"""
            )
            
            new_id = cur.fetchone()['id']
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Service created', 'id': new_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            service_id = body_data.get('service_id')
            title = body_data.get('title')
            description = body_data.get('description')
            price = body_data.get('price')
            is_active = body_data.get('is_active')
            display_order = body_data.get('display_order')
            
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
            
            update_fields = []
            
            if title is not None:
                title_escaped = title.replace("'", "''")
                update_fields.append(f"title = '{title_escaped}'")
            if description is not None:
                description_escaped = description.replace("'", "''")
                update_fields.append(f"description = '{description_escaped}'")
            if price is not None:
                update_fields.append(f"price = {price}")
            if is_active is not None:
                update_fields.append(f"is_active = {is_active}")
            if display_order is not None:
                update_fields.append(f"display_order = {display_order}")
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            service_id_escaped = service_id.replace("'", "''")
            
            query = f"UPDATE services SET {', '.join(update_fields)} WHERE service_id = '{service_id_escaped}'"
            cur.execute(query)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
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
            
            service_id_escaped = service_id.replace("'", "''")
            cur.execute(f"DELETE FROM services WHERE service_id = '{service_id_escaped}'")
            
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