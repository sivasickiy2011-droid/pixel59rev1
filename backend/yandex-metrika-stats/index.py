import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение статистики посещений из Яндекс.Метрики
    Args: event с counter_id в body
    Returns: Данные о посещениях за последние 14 дней
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
        body_str = event.get('body', '')
        if not body_str or body_str.strip() == '':
            body_data = {}
        else:
            body_data = json.loads(body_str)
        counter_id = body_data.get('counter_id')
        oauth_token = body_data.get('token')
        
        if not counter_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'counter_id is required'}),
                'isBase64Encoded': False
            }
        
        if not oauth_token:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'token is required'}),
                'isBase64Encoded': False
            }
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=13)
        
        date1 = start_date.strftime('%Y-%m-%d')
        date2 = end_date.strftime('%Y-%m-%d')
        
        url = f'https://api-metrika.yandex.net/stat/v1/data'
        
        params = {
            'id': counter_id,
            'metrics': 'ym:s:visits',
            'dimensions': 'ym:s:date',
            'date1': date1,
            'date2': date2,
            'sort': 'ym:s:date'
        }
        
        headers = {
            'Authorization': f'OAuth {oauth_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to fetch data from Yandex Metrika',
                    'details': response.text
                }),
                'isBase64Encoded': False
            }
        
        data = response.json()
        
        visits = []
        if 'data' in data:
            for item in data['data']:
                date_str = item['dimensions'][0]['name']
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                formatted_date = date_obj.strftime('%d.%m')
                
                visit_count = int(item['metrics'][0])
                
                visits.append({
                    'date': formatted_date,
                    'visits': visit_count
                })
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'visits': visits}),
            'isBase64Encoded': False
        }
        
    except json.JSONDecodeError as e:
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