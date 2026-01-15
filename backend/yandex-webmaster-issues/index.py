import json
import os
from typing import Dict, Any, List
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение замечаний от Яндекс.Вебмастера
    Args: event с host_url в query параметрах (опционально)
    Returns: Список проблем и рекомендаций от Яндекса
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
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
        oauth_token = os.environ.get('YANDEX_WEBMASTER_TOKEN')
        
        if not oauth_token:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'YANDEX_WEBMASTER_TOKEN not configured'}),
                'isBase64Encoded': False
            }
        
        headers = {
            'Authorization': f'OAuth {oauth_token}',
            'Content-Type': 'application/json'
        }
        
        issues: List[Dict[str, Any]] = []
        user_info: Dict[str, Any] = {}
        
        # Получаем список всех сайтов пользователя
        hosts_url = 'https://api.webmaster.yandex.net/v4/user/hosts'
        
        try:
            hosts_response = requests.get(hosts_url, headers=headers, timeout=10)
            
            if hosts_response.status_code != 200:
                return {
                    'statusCode': hosts_response.status_code,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Failed to connect to Yandex.Webmaster',
                        'details': hosts_response.text
                    }),
                    'isBase64Encoded': False
                }
            
            hosts_data = hosts_response.json()
            
            if 'hosts' not in hosts_data or len(hosts_data['hosts']) == 0:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'issues': [],
                        'message': 'Нет добавленных сайтов в Яндекс.Вебмастере'
                    }),
                    'isBase64Encoded': False
                }
            
            # Берем первый сайт
            first_host = hosts_data['hosts'][0]
            host_id = first_host['host_id']
            user_id = first_host['user_id']
            host_url = first_host.get('unicode_host_url', first_host.get('ascii_host_url', 'unknown'))
            
            user_info = {
                'host_url': host_url,
                'verified': first_host.get('verified', False),
                'total_hosts': len(hosts_data['hosts'])
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Failed to get hosts list: {str(e)}'}),
                'isBase64Encoded': False
            }
        
        # Теперь получаем проблемы для найденного сайта
        indexing_url = f'https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/summary'
        
        try:
            indexing_response = requests.get(indexing_url, headers=headers, timeout=10)
            
            if indexing_response.status_code == 200:
                indexing_data = indexing_response.json()
                
                if 'site_problems' in indexing_data:
                    for problem in indexing_data['site_problems']:
                        severity = 'critical' if problem.get('importance') == 'CRITICAL' else 'warning'
                        issues.append({
                            'type': problem.get('title', 'Проблема индексации'),
                            'severity': severity,
                            'description': problem.get('description', 'Нет описания')
                        })
        except Exception as e:
            print(f"Failed to fetch indexing data: {e}")
        
        diagnostics_url = f'https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/diagnostics'
        
        try:
            diagnostics_response = requests.get(diagnostics_url, headers=headers, timeout=10)
            
            if diagnostics_response.status_code == 200:
                diagnostics_data = diagnostics_response.json()
                
                if 'problems' in diagnostics_data:
                    for problem in diagnostics_data['problems']:
                        problem_type = problem.get('problem_type', 'unknown')
                        severity = 'critical' if problem.get('severity') == 'ERROR' else 'warning'
                        
                        issues.append({
                            'type': get_problem_title(problem_type),
                            'severity': severity,
                            'description': problem.get('description', 'Обнаружена проблема на сайте'),
                            'url': problem.get('url')
                        })
        except Exception as e:
            print(f"Failed to fetch diagnostics data: {e}")
        
        sqi_url = f'https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/sqi-history'
        
        try:
            sqi_response = requests.get(sqi_url, headers=headers, timeout=10)
            
            if sqi_response.status_code == 200:
                sqi_data = sqi_response.json()
                
                if 'indicators' in sqi_data and len(sqi_data['indicators']) > 0:
                    latest_sqi = sqi_data['indicators'][-1]
                    sqi_value = latest_sqi.get('value', 0)
                    
                    if sqi_value < 50:
                        issues.append({
                            'type': 'Низкий ИКС (индекс качества сайта)',
                            'severity': 'warning',
                            'description': f'Индекс качества сайта: {sqi_value}. Рекомендуется улучшить контент и SEO'
                        })
        except Exception as e:
            print(f"Failed to fetch SQI data: {e}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'issues': issues,
                'user_info': user_info
            }),
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

def get_problem_title(problem_type: str) -> str:
    '''Преобразует тип проблемы в человекочитаемый заголовок'''
    problem_titles = {
        'SITEMAP_ERROR': 'Ошибка в sitemap.xml',
        'ROBOTS_TXT_ERROR': 'Ошибка в robots.txt',
        'HTTPS_ERROR': 'Проблемы с HTTPS',
        'MOBILE_FRIENDLY': 'Проблемы с мобильной версией',
        'PAGE_SPEED': 'Низкая скорость загрузки',
        'BROKEN_LINKS': 'Битые ссылки на сайте',
        'DUPLICATE_CONTENT': 'Дублирующийся контент',
        'THIN_CONTENT': 'Недостаточно контента',
        'CRAWL_ERRORS': 'Ошибки сканирования'
    }
    
    return problem_titles.get(problem_type, 'Проблема на сайте')