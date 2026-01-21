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
    # Удаление HTML-тегов
    text = re.sub(r'<[^>]+>', '', text)
    # Удаление шаблонных паттернов типа <Publication URL: ... >
    text = re.sub(r'<[^>]+>', '', text)  # повторно на случай вложенных тегов
    # Удаление паттернов типа <Публикация URL: ... >
    text = re.sub(r'<[^>]+URL:[^>]+>', '', text)
    # Удаление метаданных типа [source], [link], etc.
    text = re.sub(r'\[[^\]]+\]', '', text)
    # Удаление строк, содержащих метаданные RSS (Post URL, Comments URL, Points, # Comments) и их переводы
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in ['url:', 'points:', '# comments:', 'comments url:', 'post url:', 'article url:', 'публикация url:', 'оценки:', 'комментарии:', 'адрес статьи:', 'адрес комментариев:', 'article url:', 'comments url:', 'points:', '# comments:', 'оценка:', 'комментарии:']):
            continue
        cleaned_lines.append(line)
    text = ' '.join(cleaned_lines)
    # Удаление оставшихся паттернов типа "Article URL: ..." даже если они не на отдельных строках
    patterns = [
        r'Article URL:\s*\S+',
        r'Comments URL:\s*\S+',
        r'Points:\s*\d+',
        r'# Comments:\s*\d+',
        r'Post URL:\s*\S+',
        r'публикация url:\s*\S+',
        r'адрес статьи:\s*\S+',
        r'адрес комментариев:\s*\S+',
        r'оценки?:\s*\d+',
        r'комментарии:\s*\d+',
    ]
    for pattern in patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    # Удаление лишних пробелов и переводов строк
    text = re.sub(r'\s+', ' ', text)
    # Удаление начальных/конечных пробелов
    text = text.strip()
    # Удаление повторяющихся точек и запятых
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r',{2,}', ',', text)
    return text

def extract_image(entry) -> str:
    # Попробуем найти изображение в медиа
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if 'url' in media:
                url = media['url']
                if url and url.startswith('http'):
                    return url
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        for thumb in entry.media_thumbnail:
            if 'url' in thumb:
                url = thumb['url']
                if url and url.startswith('http'):
                    return url
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enclosure in entry.enclosures:
            if 'image' in enclosure.get('type', '') or enclosure.get('type', '').startswith('image/'):
                href = enclosure.get('href', '')
                if href and href.startswith('http'):
                    return href
    # Поиск изображения в summary/description
    summary = entry.summary if hasattr(entry, 'summary') else ''
    # Ищем og:image мета-тег
    og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\'>]+)["\']', summary, re.IGNORECASE)
    if og_match:
        return og_match.group(1)
    # Ищем тег img
    img_match = re.search(r'<img[^>]+src=["\']([^"\'>]+)["\']', summary)
    if img_match:
        return img_match.group(1)
    # Если источник Hacker News, используем логотип
    if 'news.ycombinator.com' in entry.get('link', ''):
        return 'https://news.ycombinator.com/favicon.ico'
    # Если источник Netlify, используем логотип
    if 'netlify.com' in entry.get('link', ''):
        return 'https://www.netlify.com/img/global/favicon/favicon-32x32.png'
    # Для web.dev используем логотип
    if 'web.dev' in entry.get('link', ''):
        return 'https://web.dev/images/favicon-32x32.png'
    # Заглушка по умолчанию (тематическая картинка)
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
        # Более строгий промпт с явным требованием только перевода
        prompt = f"Ты переводчик с английского на русский. Переведи следующий текст на русский язык. Не добавляй никаких пояснений, комментариев, дополнительного текста. Верни только перевод. Текст: {text[:500]}"
        payload = json.dumps({
            'model': 'llama3.2',
            'prompt': prompt,
            'stream': False,
            'options': {'temperature': 0.1, 'num_predict': 300}
        })
        headers = {'Content-Type': 'application/json'}
        conn.request('POST', '/api/generate', payload, headers)
        response = conn.getresponse()
        data = response.read().decode('utf-8')
        if response.status == 200:
            result = json.loads(data)
            translated = result.get('response', '').strip()
            # Очистка от лишних символов и префиксов
            translated = translated.replace('"', '').replace('\n', ' ').strip()
            # Удаление возможных префиксов
            prefixes = ['Translation:', 'Перевод:', 'Russian translation:', 'Перевод на русский:', 'Текст на русском:', 'Вот перевод:']
            for prefix in prefixes:
                if translated.lower().startswith(prefix.lower()):
                    translated = translated[len(prefix):].strip()
            # Если перевод не изменился (остался оригинальным), возможно, модель не перевела
            if translated and translated != text[:500]:
                conn.close()
                return translated
        conn.close()
    except Exception as e:
        print(f'Ollama translation error: {e}')
        pass
    
    # Fallback: return original text
    return text

def translate_full_content(text: str) -> str:
    """Перевод полного контента (ограничиваем размер для Ollama)"""
    if not text or len(text.strip()) < 10:
        return text
    # Ограничиваем размер контента для перевода (первые 2000 символов)
    truncated = text[:2000]
    return translate_text(truncated)

def fetch_and_translate_news() -> List[Dict[str, Any]]:
    feeds = [
        {
            'url': 'https://hnrss.org/newest',
            'source': 'Hacker News',
            'sourceUrl': 'https://news.ycombinator.com/',
            'category': 'Технологии',
            'limit': 4
        },
        {
            'url': 'https://news.ycombinator.com/rss',
            'source': 'Hacker News RSS',
            'sourceUrl': 'https://news.ycombinator.com/',
            'category': 'Технологии',
            'limit': 3
        },
        {
            'url': 'https://www.netlify.com/blog/rss/',
            'source': 'Netlify Blog',
            'sourceUrl': 'https://www.netlify.com/blog/',
            'category': 'Веб-разработка',
            'limit': 3
        }
    ]
    
    all_news = []
    
    for feed_info in feeds:
        feed = feedparser.parse(feed_info['url'])
        limit = feed_info.get('limit', 4)
        
        for entry in feed.entries[:limit]:
            category = feed_info['category']
            # Попробуем определить подкатегорию из тегов
            if hasattr(entry, 'tags') and entry.tags:
                cat = entry.tags[0].term if entry.tags[0].term else 'Web'
                category_map = {
                    'Web': 'Веб', 'Python': 'Python', 'AI': 'ИИ',
                    'JavaScript': 'JavaScript', 'CSS': 'CSS',
                    'React': 'React', 'Node': 'Node.js', 'Security': 'Безопасность',
                    'Startup': 'Стартапы', 'Design': 'Дизайн'
                }
                subcategory = category_map.get(cat, cat)
                category = f"{category} · {subcategory}"
            
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
            
            # Переводим полный контент
            original_content_raw = entry.summary if hasattr(entry, 'summary') else ''
            # Очищаем от HTML и метаданных перед переводом
            original_content = clean_html(original_content_raw)
            # Ограничиваем длину для перевода
            content_to_translate = original_content[:2000]
            # Переводим
            translated_content_raw = translate_full_content(content_to_translate)
            # Очищаем переведенный текст
            translated_content = clean_html(translated_content_raw)
            print(f'Original content length: {len(original_content)}')
            print(f'Translated content length: {len(translated_content)}')
            
            news_item = {
                'original_title': entry.title,
                'translated_title': title_ru,
                'original_excerpt': clean_summary,
                'translated_excerpt': excerpt_ru,
                'original_content': original_content,
                'translated_content': translated_content,
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
                # Проверяем, нужно ли обновить перевод контента
                need_update = False
                # Если translated_content пуст в базе, обновляем
                cur.execute("SELECT translated_content FROM news WHERE id = %s", (existing[0],))
                trans_content_row = cur.fetchone()
                if trans_content_row and (trans_content_row[0] is None or trans_content_row[0].strip() == ''):
                    need_update = True
                
                if need_update:
                    cur.execute(
                        """UPDATE news SET
                           original_title = %s,
                           translated_title = %s,
                           original_excerpt = %s,
                           translated_excerpt = %s,
                           original_content = %s,
                           translated_content = %s,
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
                            item['translated_content'],
                            item['source'],
                            item['source_url'],
                            item['image_url'],
                            item['category'],
                            item['published_date'],
                            item['link']
                        )
                    )
                    updated += 1
                    print(f'Updated news item {item["link"]} with translated content')
                else:
                    # Already translated, skip
                    print(f'Skipping news item {item["link"]} (already translated)')
            else:
                # Insert new
                cur.execute(
                    """INSERT INTO news
                       (original_title, translated_title, original_excerpt, translated_excerpt,
                        original_content, translated_content, source, source_url, link, image_url, category,
                        published_date, translated_at, created_at, updated_at, is_active)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)""",
                    (
                        item['original_title'],
                        item['translated_title'],
                        item['original_excerpt'],
                        item['translated_excerpt'],
                        item['original_content'],
                        item['translated_content'],
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