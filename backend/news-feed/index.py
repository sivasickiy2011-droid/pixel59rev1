import json
import feedparser
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import re
from html import unescape
import os
import http.client

cache: Dict[str, Any] = {}
cache_timestamp: Optional[datetime] = None
CACHE_DURATION_HOURS = 24

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение последних новостей из RSS-фидов web.dev и SitePoint с кешированием на 24 часа
    Args: event с httpMethod (GET/OPTIONS)
    Returns: JSON с массивом новостей
    '''
    global cache, cache_timestamp
    
    method: str = event.get('httpMethod', 'GET')
    
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
    
    now = datetime.now()
    if cache_timestamp and (now - cache_timestamp) < timedelta(hours=CACHE_DURATION_HOURS):
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': f'public, max-age={CACHE_DURATION_HOURS * 3600}'
            },
            'isBase64Encoded': False,
            'body': json.dumps(cache)
        }
    
    feeds = [
        {
            'url': 'https://web.dev/feed.xml',
            'source': 'web.dev',
            'sourceUrl': 'https://web.dev/'
        },
        {
            'url': 'https://www.sitepoint.com/feed/',
            'source': 'SitePoint',
            'sourceUrl': 'https://www.sitepoint.com/'
        }
    ]
    
    all_news: List[Dict[str, Any]] = []
    
    def clean_html(text: str) -> str:
        text = unescape(text)
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def extract_image(entry) -> str:
        if hasattr(entry, 'media_content') and entry.media_content:
            return entry.media_content[0]['url']
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            return entry.media_thumbnail[0]['url']
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enclosure in entry.enclosures:
                if 'image' in enclosure.get('type', ''):
                    return enclosure.get('href', '')
        summary = entry.summary if hasattr(entry, 'summary') else ''
        img_match = re.search(r'<img[^>]+src=["\']([^"\'>]+)["\']', summary)
        if img_match:
            return img_match.group(1)
        return 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800'
    
    def translate_month(date_str: str) -> str:
        months = {
            'January': 'января', 'February': 'февраля', 'March': 'марта',
            'April': 'апреля', 'May': 'мая', 'June': 'июня',
            'July': 'июля', 'August': 'августа', 'September': 'сентября',
            'October': 'октября', 'November': 'ноября', 'December': 'декабря'
        }
        for eng, rus in months.items():
            date_str = date_str.replace(eng, rus)
        return date_str
    
    def translate_text(text: str) -> str:
        if not text or len(text.strip()) < 3:
            return text
        
        api_key = os.environ.get('YANDEX_TRANSLATE_API_KEY')
        folder_id = os.environ.get('YANDEX_TRANSLATE_FOLDER_ID')
        
        if not api_key or not folder_id:
            return text
        
        try:
            conn = http.client.HTTPSConnection('translate.api.cloud.yandex.net', timeout=3)
            
            payload = json.dumps({
                'folderId': folder_id,
                'texts': [text[:500]],
                'targetLanguageCode': 'ru'
            })
            
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Api-Key {api_key}'
            }
            
            conn.request('POST', '/translate/v2/translate', payload, headers)
            response = conn.getresponse()
            data = response.read().decode('utf-8')
            
            if response.status == 200:
                result = json.loads(data)
                if result and 'translations' in result and len(result['translations']) > 0:
                    translated = result['translations'][0]['text']
                    conn.close()
                    return translated
            
            conn.close()
        except:
            pass
        
        return text
    
    for feed_info in feeds:
        feed = feedparser.parse(feed_info['url'])
        
        for entry in feed.entries[:12]:
            category = 'Веб-разработка'
            if hasattr(entry, 'tags') and entry.tags:
                cat = entry.tags[0].term if entry.tags[0].term else 'Web'
                category_map = {
                    'Web': 'Веб', 'Python': 'Python', 'AI': 'ИИ',
                    'JavaScript': 'JavaScript', 'CSS': 'CSS',
                    'React': 'React', 'Node': 'Node.js'
                }
                category = category_map.get(cat, cat)
            
            published = entry.published if hasattr(entry, 'published') else ''
            try:
                date_obj = datetime.strptime(published, '%a, %d %b %Y %H:%M:%S %Z')
                formatted_date = translate_month(date_obj.strftime('%d %B %Y'))
            except:
                try:
                    date_obj = datetime.strptime(published, '%a, %d %b %Y %H:%M:%S %z')
                    formatted_date = translate_month(date_obj.strftime('%d %B %Y'))
                except:
                    formatted_date = published
            
            clean_summary = clean_html(entry.summary if hasattr(entry, 'summary') else '')
            
            title_ru = translate_text(entry.title)
            excerpt_text = clean_summary[:120]
            excerpt_ru = translate_text(excerpt_text)
            if len(excerpt_text) >= 120:
                excerpt_ru = excerpt_ru + '...'
            
            news_item = {
                'title': title_ru,
                'excerpt': excerpt_ru,
                'content': entry.summary if hasattr(entry, 'summary') else '',
                'source': feed_info['source'],
                'sourceUrl': feed_info['sourceUrl'],
                'date': formatted_date,
                'category': category,
                'link': entry.link,
                'image': extract_image(entry)
            }
            all_news.append(news_item)
    
    all_news = sorted(all_news, key=lambda x: x['date'], reverse=True)[:12]
    
    cache = {'news': all_news}
    cache_timestamp = datetime.now()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': f'public, max-age={CACHE_DURATION_HOURS * 3600}'
        },
        'isBase64Encoded': False,
        'body': json.dumps(cache)
    }