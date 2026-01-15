import json
import os
from typing import Dict, Any, List
from pydantic import BaseModel, Field
import openai
import psycopg2
import base64

_secret_cache = {}

def get_secret(key: str) -> str:
    '''Reads secret from database with caching'''
    if key in _secret_cache:
        return _secret_cache[key]
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        key_escaped = key.replace("'", "''")
        cur.execute(f"SELECT encrypted_value FROM secure_settings WHERE key = '{key_escaped}'")
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if row:
            value = base64.b64decode(row[0].encode()).decode()
            _secret_cache[key] = value
            return value
    except Exception as e:
        print(f'DB secret read error for {key}: {str(e)}')
    
    env_value = os.environ.get(key, '')
    _secret_cache[key] = env_value
    return env_value

class SeoAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    current_title: str = ""
    current_description: str = ""

class SeoSuggestion(BaseModel):
    title: str
    description: str
    h1_suggestions: List[str]
    keywords: List[str]
    improvements: List[str]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Analyzes page content and provides SEO optimization suggestions using AI
    Args: event with httpMethod, body containing url, content, current_title, current_description
          context with request_id
    Returns: SEO suggestions with optimized title, description, keywords, and improvements
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    api_key = get_secret('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OpenAI API key not configured'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    request_data = SeoAnalysisRequest(**body_data)
    
    openai.api_key = api_key
    
    # Настраиваем endpoint и модель
    api_base = get_secret('OPENAI_API_BASE') or 'https://api.openai.com/v1'
    openai.api_base = api_base
    
    # Определяем модель в зависимости от провайдера
    is_openrouter = 'openrouter' in api_base.lower()
    model = 'openai/gpt-4o-mini' if is_openrouter else os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
    
    prompt = f"""Analyze this webpage content and provide SEO optimization suggestions in Russian.

URL: {request_data.url}
Current Title: {request_data.current_title or 'Not set'}
Current Description: {request_data.current_description or 'Not set'}

Page Content:
{request_data.content[:3000]}

Provide:
1. Optimized title (max 60 characters)
2. Optimized meta description (max 160 characters)
3. 3-5 H1 heading suggestions
4. 5-10 relevant keywords
5. 3-5 specific improvement recommendations

Respond ONLY with valid JSON in this exact format:
{{
    "title": "optimized title here",
    "description": "optimized description here",
    "h1_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"]
}}"""
    
    try:
        
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert SEO consultant. Always respond with valid JSON only, no additional text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        ai_response = response['choices'][0]['message']['content'].strip()
        
        if ai_response.startswith('```json'):
            ai_response = ai_response[7:]
        if ai_response.startswith('```'):
            ai_response = ai_response[3:]
        if ai_response.endswith('```'):
            ai_response = ai_response[:-3]
        ai_response = ai_response.strip()
        
        suggestions = json.loads(ai_response)
        validated = SeoSuggestion(**suggestions)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'title': validated.title,
                'description': validated.description,
                'h1_suggestions': validated.h1_suggestions,
                'keywords': validated.keywords,
                'improvements': validated.improvements,
                'request_id': context.request_id
            }),
            'isBase64Encoded': False
        }
    
    except json.JSONDecodeError as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Failed to parse AI response: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }