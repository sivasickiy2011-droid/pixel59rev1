'''
Business: Save user consent data (cookies, terms, privacy) to database
Args: event with httpMethod, body containing consent data
Returns: HTTP response with success/error status
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
    
    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            
            full_name = body_data.get('fullName', '').strip()
            phone = body_data.get('phone', '').strip() or None
            email = body_data.get('email', '').strip() or None
            cookies = body_data.get('cookies', False)
            terms = body_data.get('terms', False)
            privacy = body_data.get('privacy', False)
            
            if not full_name:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Full name is required'})
                }
            
            request_context = event.get('requestContext', {})
            ip_address = request_context.get('identity', {}).get('sourceIp', 'unknown')
            user_agent = event.get('headers', {}).get('user-agent', 'unknown')
            
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                raise Exception('DATABASE_URL not configured')
            
            conn = psycopg2.connect(database_url)
            cur = conn.cursor()
            
            insert_query = '''
                INSERT INTO user_consents 
                (full_name, phone, email, cookies_accepted, terms_accepted, privacy_accepted, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            '''
            
            cur.execute(insert_query, (
                full_name,
                phone,
                email,
                cookies,
                terms,
                privacy,
                ip_address,
                user_agent
            ))
            
            result = cur.fetchone()
            consent_id = result[0] if result else None
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'id': consent_id
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'error': 'Internal server error',
                    'message': str(e)
                })
            }
    
    if method == 'GET':
        try:
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                raise Exception('DATABASE_URL not configured')
            
            conn = psycopg2.connect(database_url)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute('''
                SELECT id, full_name, phone, email, 
                       cookies_accepted, terms_accepted, privacy_accepted,
                       ip_address, created_at
                FROM user_consents
                ORDER BY created_at DESC
                LIMIT 100
            ''')
            
            consents = cur.fetchall()
            
            cur.close()
            conn.close()
            
            result = []
            for consent in consents:
                result.append({
                    'id': consent['id'],
                    'fullName': consent['full_name'],
                    'phone': consent['phone'],
                    'email': consent['email'],
                    'cookies': consent['cookies_accepted'],
                    'terms': consent['terms_accepted'],
                    'privacy': consent['privacy_accepted'],
                    'ipAddress': consent['ip_address'],
                    'createdAt': consent['created_at'].isoformat() if consent['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'consents': result})
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'error': 'Internal server error',
                    'message': str(e)
                })
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
