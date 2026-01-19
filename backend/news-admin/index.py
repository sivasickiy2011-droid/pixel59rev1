import json
import feedparser
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import re
from html import unescape
import os
import http.client
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not set')
    return psycopg2.connect(dsn)

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
    
    # Use Ollama for translation with llama3.2 model
    try:
        conn = http.client.HTTPConnection('localhost', 11434, timeout=30)
        prompt = f"Translate the following English text to Russian. Return only the translation without any additional text or explanations. Text: {text[:500]}"
        payload = json.dumps({
            'model': 'llama3.2',
            'prompt': prompt,
            'stream': False,
            'options': {'temperature': 0.2, 'num_predict': 200}
        })
        headers = {'Content-Type': 'application/json'}
        conn.request('POST', '/api/generate', payload, headers)
        response = conn.getresponse()
        data = response.read().decode('utf-8')
        if response.status == 200:
            result = json.loads(data)
            translated = result.get('response', '').strip()
            # Clean up extra whitespace, quotation marks, and possible prefixes like "Translation:"
            translated = translated.replace('"', '').replace('\n', ' ').strip()
            # Remove common prefixes
            prefixes = ['Translation:', 'Перевод:', 'Russian translation:']
            for prefix in prefixes:
                if translated.lower().startswith(prefix.lower()):
                    translated = translated[len(prefix):].strip()
            if translated:
                conn.close()
                return translated
        conn.close()
    except Exception as e:
        print(f'Ollama translation error: {e}')
        pass
    
    # Fallback: return original text
    return text

def fetch_and_translate_news() -> List[Dict[str, Any]]:
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
    
    all_news = []
    
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
                published_date = date_obj
            except:
                try:
                    date_obj = datetime.strptime(published, '%a, %d %b %Y %H:%M:%S %z')
                    formatted_date = translate_month(date_obj.strftime('%d %B %Y'))
                    published_date = date_obj
                except:
                    formatted_date = published
                    published_date = datetime.now()
            
            clean_summary = clean_html(entry.summary if hasattr(entry, 'summary') else '')
            
            title_ru = translate_text(entry.title)
            excerpt_text = clean_summary[:120]
            excerpt_ru = translate_text(excerpt_text)
            if len(excerpt_text) >= 120:
                excerpt_ru = excerpt_ru + '...'
            
            news_item = {
                'original_title': entry.title,
                'translated_title': title_ru,
                'original_excerpt': clean_summary,
                'translated_excerpt': excerpt_ru,
                'original_content': entry.summary if hasattr(entry, 'summary') else '',
                'translated_content': '',  # можно оставить пустым или перевести полный контент
                'source': feed_info['source'],
                'source_url': feed_info['sourceUrl'],
                'link': entry.link,
                'image_url': extract_image(entry),
                'category': category,
                'published_date': published_date,
                'formatted_date': formatted_date
            }
            all_news.append(news_item)
    
    return all_news

def save_news_to_db(news_items: List[Dict[str, Any]]) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    inserted = 0
    updated = 0
    errors = 0
    
    for item in news_items:
        try:
            # Check if news already exists by link
            cur.execute(
                "SELECT id, translated_title FROM news WHERE link = %s",
                (item['link'],)
            )
            existing = cur.fetchone()
            
            if existing:
                # Update if translation missing or outdated
                if not existing[1] or existing[1].strip() == '':
                    cur.execute(
                        """UPDATE news SET
                           original_title = %s,
                           translated_title = %s,
                           original_excerpt = %s,
                           translated_excerpt = %s,
                           original_content = %s,
                           source = %s,
                           source_url = %s,
                           image_url = %s,
                           category = %s,
                           published_date = %s,
                           updated_at = CURRENT_TIMESTAMP,
                           translated_at = CURRENT_TIMESTAMP
                           WHERE link = %s""",
                        (
                            item['original_title'],
                            item['translated_title'],
                            item['original_excerpt'],
                            item['translated_excerpt'],
                            item['original_content'],
                            item['source'],
                            item['source_url'],
                            item['image_url'],
                            item['category'],
                            item['published_date'],
                            item['link']
                        )
                    )
                    updated += 1
                else:
                    # Already translated, skip
                    pass
            else:
                # Insert new
                cur.execute(
                    """INSERT INTO news
                       (original_title, translated_title, original_excerpt, translated_excerpt,
                        original_content, source, source_url, link, image_url, category,
                        published_date, translated_at, created_at, updated_at, is_active)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)""",
                    (
                        item['original_title'],
                        item['translated_title'],
                        item['original_excerpt'],
                        item['translated_excerpt'],
                        item['original_content'],
                        item['source'],
                        item['source_url'],
                        item['link'],
                        item['image_url'],
                        item['category'],
                        item['published_date']
                    )
                )
                inserted += 1
        except Exception as e:
            print(f"Error saving news item {item['link']}: {e}")
            errors += 1
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'inserted': inserted,
        'updated': updated,
        'errors': errors,
        'total_processed': len(news_items)
    }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Административный эндпоинт для обновления новостей (перевод и сохранение в БД)
    Args: event с httpMethod (POST/OPTIONS)
    Returns: JSON с результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Проверка авторизации администратора (опционально)
    # Можно добавить проверку токена или пароля из заголовков
    
    try:
        print('Fetching and translating news...')
        news_items = fetch_and_translate_news()
        print(f'Fetched {len(news_items)} news items')
        
        result = save_news_to_db(news_items)
        print(f'Save result: {result}')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'News updated successfully',
                'result': result
            })
        }
    except Exception as e:
        print(f'Error in news admin handler: {e}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }