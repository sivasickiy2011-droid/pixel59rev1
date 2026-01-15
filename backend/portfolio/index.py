"""
Portfolio management API
Business: Управление проектами портфолио - получение списка для фронтенда и CRUD операции для админки
Args: event - dict with httpMethod, body, headers, queryStringParameters
      context - object with request_id, function_name attributes
Returns: HTTP response dict with statusCode, headers, body
"""

import json
import os
import psycopg2
from typing import Dict, Any, List

def get_db_connection():
    """Create database connection"""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(dsn)

def get_all_projects() -> List[Dict[str, Any]]:
    """Get all active portfolio projects sorted by display_order"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, title, description, image_url, carousel_image_url, preview_image_url, website_url, display_order, is_active, created_at
                FROM t_p26695620_cav_bitrix_portfolio.portfolio_projects
                WHERE is_active = true
                ORDER BY display_order ASC, created_at DESC
            """)
            
            columns = [desc[0] for desc in cur.description]
            projects = []
            for row in cur.fetchall():
                project = dict(zip(columns, row))
                if project.get('created_at'):
                    project['created_at'] = project['created_at'].isoformat()
                projects.append(project)
            
            return projects
    finally:
        conn.close()

def create_project(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create new portfolio project"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO t_p26695620_cav_bitrix_portfolio.portfolio_projects 
                (title, description, image_url, carousel_image_url, preview_image_url, website_url, display_order, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, title, description, image_url, carousel_image_url, preview_image_url, website_url, display_order, is_active, created_at
            """, (
                data.get('title', '')[:10],
                data.get('description', ''),
                data.get('image_url', ''),
                data.get('carousel_image_url'),
                data.get('preview_image_url'),
                data.get('website_url', ''),
                data.get('display_order', 0),
                data.get('is_active', True)
            ))
            
            conn.commit()
            
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            project = dict(zip(columns, row))
            if project.get('created_at'):
                project['created_at'] = project['created_at'].isoformat()
            
            return project
    finally:
        conn.close()

def update_project(project_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update portfolio project"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE t_p26695620_cav_bitrix_portfolio.portfolio_projects
                SET title = %s, description = %s, image_url = %s, carousel_image_url = %s, preview_image_url = %s, 
                    website_url = %s, display_order = %s, is_active = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, title, description, image_url, carousel_image_url, preview_image_url, website_url, display_order, is_active, created_at
            """, (
                data.get('title', '')[:10],
                data.get('description', ''),
                data.get('image_url', ''),
                data.get('carousel_image_url'),
                data.get('preview_image_url'),
                data.get('website_url', ''),
                data.get('display_order', 0),
                data.get('is_active', True),
                project_id
            ))
            
            conn.commit()
            
            columns = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            if not row:
                return None
            
            project = dict(zip(columns, row))
            if project.get('created_at'):
                project['created_at'] = project['created_at'].isoformat()
            
            return project
    finally:
        conn.close()

def delete_project(project_id: int) -> bool:
    """Delete portfolio project"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM t_p26695620_cav_bitrix_portfolio.portfolio_projects
                WHERE id = %s
            """, (project_id,))
            
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        if method == 'GET':
            projects = get_all_projects()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(projects),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            project = create_project(body_data)
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(project),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            project_id = body_data.get('id')
            
            if not project_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Project ID is required'}),
                    'isBase64Encoded': False
                }
            
            project = update_project(project_id, body_data)
            
            if not project:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Project not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(project),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            project_id = body_data.get('id')
            
            if not project_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Project ID is required'}),
                    'isBase64Encoded': False
                }
            
            deleted = delete_project(project_id)
            
            if not deleted:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Project not found'}),
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