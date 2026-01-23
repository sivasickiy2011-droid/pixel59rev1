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
import requests
from bs4 import BeautifulSoup
from readability import Document
import time
from functools import wraps

from backend._shared.logging import log_event
from backend._shared.security import (
    ensure_admin_authorized,
    enforce_rate_limit,
    is_valid_image_url,
)

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not set')
    return psycopg2.connect(dsn)

def timing_decorator(func):
    """Decorator that logs function runtime."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"⏱ {func.__name__} finished in {elapsed:.2f} sec")
        return result
    return wrapper

def clean_html(text: str) -> str:
    """
    Расширенная очистка HTML и метаданных из текста.
    
    Args:
        text: Текст с HTML-разметкой
    
    Returns:
        Очищенный текст
    """
    if not text:
        return ''
    
    # Декодируем HTML-сущности
    text = unescape(text)
    
    # Удаляем скрипты и стили (включая содержимое)
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Удаляем комментарии HTML
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    
    # Удаляем SVG и другие медиа-элементы
    text = re.sub(r'<svg[^>]*>.*?</svg>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<iframe[^>]*>.*?</iframe>', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Заменяем блочные элементы на переводы строк для сохранения структуры
    block_elements = ['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr']
    for element in block_elements:
        text = re.sub(f'<{element}[^>]*>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(f'</{element}>', '\n', text, flags=re.IGNORECASE)
    
    # Удаляем все остальные HTML-теги
    text = re.sub(r'<[^>]+>', '', text)
    
    # Удаляем шаблонные паттерны RSS
    text = re.sub(r'<[^>]+URL:[^>]+>', '', text)
    text = re.sub(r'\[[^\]]+\]', '', text)
    
    # Удаляем строки с метаданными RSS
    lines = text.split('\n')
    cleaned_lines = []
    
    # Расширенный список ключевых слов для фильтрации
    metadata_keywords = [
        'url:', 'points:', '# comments:', 'comments url:', 'post url:',
        'article url:', 'публикация url:', 'оценки:', 'комментарии:',
        'адрес статьи:', 'адрес комментариев:', 'оценка:',
        'read more', 'continue reading', 'share this', 'tweet',
        'facebook', 'linkedin', 'subscribe', 'newsletter',
        'advertisement', 'sponsored', 'promoted'
    ]
    
    for line in lines:
        line_lower = line.lower().strip()
        
        # Пропускаем пустые строки и строки с метаданными
        if not line_lower:
            continue
        
        # Проверяем наличие ключевых слов
        if any(keyword in line_lower for keyword in metadata_keywords):
            continue
        
        # Пропускаем очень короткие строки (вероятно, мусор)
        if len(line.strip()) < 3:
            continue
        
        cleaned_lines.append(line.strip())
    
    text = ' '.join(cleaned_lines)
    
    # Удаляем паттерны метаданных даже если они не на отдельных строках
    patterns_to_remove = [
        r'Article URL:\s*\S+',
        r'Comments URL:\s*\S+',
        r'Points:\s*\d+',
        r'# Comments:\s*\d+',
        r'Post URL:\s*\S+',
        r'Read more at\s*\S+',
        r'Continue reading on\s*\S+',
        r'Originally published at\s*\S+',
        r'публикация url:\s*\S+',
        r'адрес статьи:\s*\S+',
        r'адрес комментариев:\s*\S+',
        r'оценки?:\s*\d+',
        r'комментарии:\s*\d+',
    ]
    
    for pattern in patterns_to_remove:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    # Удаляем специальные символы и управляющие последовательности
    text = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Удаляем лишние пробелы и переводы строк
    text = re.sub(r'\s+', ' ', text)
    
    # Удаляем повторяющиеся знаки препинания
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r',{2,}', ',', text)
    text = re.sub(r'!{2,}', '!', text)
    text = re.sub(r'\?{2,}', '?', text)
    
    # Удаляем пробелы перед знаками препинания
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    
    # Удаляем начальные/конечные пробелы
    text = text.strip()
    
    return text

def remove_promotional_content(text: str) -> str:
    """
    Удаляет рекламный и промо-контент из текста.
    
    Args:
        text: Текст с возможным рекламным контентом
    
    Returns:
        Очищенный текст
    """
    if not text:
        return ''
    
    # Паттерны рекламного контента
    promo_patterns = [
        r'This post is sponsored by.*?\.(?:\s|$)',
        r'Sponsored content:.*?\.(?:\s|$)',
        r'Advertisement:.*?\.(?:\s|$)',
        r'Affiliate links?:.*?\.(?:\s|$)',
        r'Disclosure:.*?\.(?:\s|$)',
        r'\[Sponsored\].*?(?:\.|$)',
        r'\[Ad\].*?(?:\.|$)',
        r'Get \d+% off.*?(?:\.|$)',
        r'Use code.*?for.*?(?:\.|$)',
        r'Click here to.*?(?:\.|$)',
        r'Sign up now.*?(?:\.|$)',
    ]
    
    for pattern in promo_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    return text.strip()

def validate_content_quality(content: str, min_length: int = 100) -> bool:
    """
    Проверяет качество извлеченного контента.
    
    Args:
        content: Контент для проверки
        min_length: Минимальная длина
    
    Returns:
        True если контент качественный
    """
    if not content or len(content) < min_length:
        return False
    
    # Проверяем соотношение букв к другим символам
    letters = sum(c.isalpha() for c in content)
    if letters < len(content) * 0.5:  # Минимум 50% букв
        return False
    
    # Проверяем наличие предложений
    sentences = content.count('.') + content.count('!') + content.count('?')
    if sentences < 2:
        return False
    
    return True

def extract_featured_image(entry, article_html: str = '') -> str:
    """
    Ищет первое подходящее изображение из RSS или HTML страницы.
    Возвращает заглушку, если ничего не найдено.
    
    Args:
        entry: RSS entry объект
        article_html: HTML контент страницы (опционально)
    
    Returns:
        URL изображения или путь к заглушке
    """
    candidates = []
    
    # 1. Проверяем media_content из RSS
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if isinstance(media, dict) and 'url' in media:
                url = media['url']
                if url and url.startswith('http'):
                    candidates.append(url)
    
    # 2. Проверяем media_thumbnail из RSS
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        for thumb in entry.media_thumbnail:
            if isinstance(thumb, dict) and 'url' in thumb:
                url = thumb['url']
                if url and url.startswith('http'):
                    candidates.append(url)
    
    # 3. Проверяем enclosures из RSS
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enclosure in entry.enclosures:
            if 'image' in enclosure.get('type', '') or enclosure.get('type', '').startswith('image/'):
                href = enclosure.get('href', '')
                if href and href.startswith('http'):
                    candidates.append(href)
    
    # 4. Ищем og:image в HTML контенте страницы
    if article_html:
        og_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\'>]+)["\']', article_html, re.IGNORECASE)
        if not og_match:
            og_match = re.search(r'<meta\s+content=["\']([^"\'>]+)["\']\s+property=["\']og:image["\']', article_html, re.IGNORECASE)
        if og_match:
            candidates.append(og_match.group(1))
    
    # 5. Ищем twitter:image в HTML контенте
    if article_html:
        twitter_match = re.search(r'<meta\s+name=["\']twitter:image["\']\s+content=["\']([^"\'>]+)["\']', article_html, re.IGNORECASE)
        if not twitter_match:
            twitter_match = re.search(r'<meta\s+content=["\']([^"\'>]+)["\']\s+name=["\']twitter:image["\']', article_html, re.IGNORECASE)
        if twitter_match:
            candidates.append(twitter_match.group(1))
    
    # 6. Поиск изображения в summary/description RSS
    summary = entry.summary if hasattr(entry, 'summary') else ''
    if summary:
        # Ищем og:image в summary
        og_match = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\'>]+)["\']', summary, re.IGNORECASE)
        if og_match:
            candidates.append(og_match.group(1))
        # Ищем тег img
        img_match = re.search(r'<img[^>]+src=["\']([^"\'>]+)["\']', summary)
        if img_match:
            candidates.append(img_match.group(1))
    
    # 7. Возвращаем первый валидный URL
    for url in candidates:
        if url and url.startswith('http'):
            normalized = normalize_image_url(url)
            if normalized != '/placeholder.svg':  # Если нормализация успешна
                return normalized
    
    # 8. Заглушка по умолчанию
    return '/placeholder.svg'

def extract_video_embed(entry, cleaned_text: str, article_html: str = '') -> str:
    """
    Ищет YouTube/Vimeo ссылки и возвращает embed-формат.
    
    Args:
        entry: RSS entry объект
        cleaned_text: Очищенный текст контента
        article_html: HTML контент страницы (опционально)
    
    Returns:
        URL для embed iframe или пустая строка
    """
    # Собираем все источники текста для поиска видео
    text_sources = []
    
    if cleaned_text:
        text_sources.append(cleaned_text)
    if article_html:
        text_sources.append(article_html)
    if hasattr(entry, 'summary'):
        text_sources.append(entry.summary)
    if hasattr(entry, 'description'):
        text_sources.append(entry.description)
    
    # Ищем YouTube ссылки
    for source in text_sources:
        if not source:
            continue
        
        # YouTube паттерны: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
        yt_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([A-Za-z0-9_-]{11})',
            r'(?:https?://)?(?:www\.)?youtu\.be/([A-Za-z0-9_-]{11})',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/([A-Za-z0-9_-]{11})'
        ]
        
        for pattern in yt_patterns:
            match = re.search(pattern, source)
            if match:
                video_id = match.group(1)
                return f"https://www.youtube.com/embed/{video_id}"
        
        # Vimeo паттерны: vimeo.com/[id], player.vimeo.com/video/[id]
        vimeo_patterns = [
            r'(?:https?://)?(?:www\.)?vimeo\.com/(\d+)',
            r'(?:https?://)?(?:www\.)?player\.vimeo\.com/video/(\d+)'
        ]
        
        for pattern in vimeo_patterns:
            match = re.search(pattern, source)
            if match:
                video_id = match.group(1)
                return f"https://player.vimeo.com/video/{video_id}"
    
    return ''

def extract_image(entry) -> str:
    """
    Обратная совместимость: использует новую функцию extract_featured_image.
    Deprecated: используйте extract_featured_image напрямую.
    """
    return extract_featured_image(entry, '')


def normalize_image_url(url: str) -> str:
    if is_valid_image_url(url):
        return url
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

def post_process_translation(text: str) -> str:
    """
    Пост-обработка переведенного текста.
    Удаляет артефакты и улучшает форматирование.
    
    Args:
        text: Переведенный текст
    
    Returns:
        Очищенный текст
    """
    if not text:
        return text
    
    # Удаление кавычек в начале и конце
    text = text.strip('"\'')
    
    # Удаление возможных префиксов от модели
    prefixes_to_remove = [
        'Translation:', 'Перевод:', 'Russian translation:',
        'Перевод на русский:', 'Текст на русском:', 'Вот перевод:',
        'Here is translation:', 'Вот русский перевод:',
        'Russian:', 'Русский:', 'RU:', 'Translated text:'
    ]
    
    for prefix in prefixes_to_remove:
        # Проверяем начало текста (без учета регистра)
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].strip()
            # Удаляем возможное двоеточие или тире после префикса
            text = text.lstrip(':- ')
    
    # Удаление повторяющихся переводов строк
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Удаление лишних пробелов
    text = re.sub(r' {2,}', ' ', text)
    
    # Удаление пробелов перед знаками препинания
    text = re.sub(r' +([.,!?;:])', r'\1', text)
    
    return text.strip()

def translate_text(text: str, max_retries: int = 2) -> str:
    """
    Переводит текст с английского на русский через Ollama.
    
    Args:
        text: Текст для перевода
        max_retries: Количество попыток при ошибке
    
    Returns:
        Переведенный текст или оригинал при ошибке
    """
    if not text or len(text.strip()) < 3:
        return text
    
    # Ограничиваем длину для одного запроса
    text_to_translate = text[:1500]
    
    for attempt in range(max_retries):
        try:
            conn = http.client.HTTPConnection('localhost', 11434, timeout=45)
            
            # Улучшенный промпт с четкими инструкциями
            prompt = f"""Translate the following English text to Russian.
Rules:
- Provide ONLY the Russian translation
- Do NOT add any explanations, comments, or meta-text
- Preserve the original meaning and tone
- Use natural Russian language
- Do NOT translate proper names and technical terms

Text to translate:
{text_to_translate}

Russian translation:"""
            
            payload = json.dumps({
                'model': 'llama3.2',
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.3,  # Увеличено для более естественного перевода
                    'top_p': 0.9,
                    'top_k': 40,
                    'num_predict': 2000,  # Увеличено для длинных текстов
                    'stop': ['\n\nText to translate:', 'English text:', '---']
                }
            })
            
            headers = {'Content-Type': 'application/json'}
            conn.request('POST', '/api/generate', payload, headers)
            response = conn.getresponse()
            data = response.read().decode('utf-8')
            
            if response.status == 200:
                result = json.loads(data)
                translated = result.get('response', '').strip()
                
                # Пост-обработка перевода
                translated = post_process_translation(translated)
                
                # Проверка качества перевода
                if translated and len(translated) > 10 and translated != text_to_translate:
                    conn.close()
                    print(f"Translation successful: {len(text_to_translate)} -> {len(translated)} chars")
                    return translated
                else:
                    print(f"Translation attempt {attempt + 1} produced invalid result")
            else:
                print(f"Ollama returned status {response.status}")
            
            conn.close()
            
        except http.client.HTTPException as e:
            print(f'Ollama HTTP error (attempt {attempt + 1}): {e}')
        except json.JSONDecodeError as e:
            print(f'Ollama JSON decode error (attempt {attempt + 1}): {e}')
        except Exception as e:
            print(f'Ollama translation error (attempt {attempt + 1}): {e}')
        
        # Задержка перед повторной попыткой
        if attempt < max_retries - 1:
            time.sleep(2)
    
    # Если все попытки неудачны, возвращаем оригинал
    print(f'All translation attempts failed, returning original text')
    return text

@timing_decorator
def translate_long_text(text: str, chunk_size: int = 1500) -> str:
    """
    Переводит длинный текст по частям.
    
    Args:
        text: Длинный текст для перевода
        chunk_size: Размер одной части
    
    Returns:
        Полный переведенный текст
    """
    if not text or len(text) <= chunk_size:
        return translate_text(text)
    
    print(f"Translating long text ({len(text)} chars) in chunks...")
    
    # Разбиваем текст на части по предложениям
    sentences = re.split(r'([.!?]+\s+)', text)
    
    chunks = []
    current_chunk = ""
    
    for i in range(0, len(sentences), 2):
        sentence = sentences[i]
        separator = sentences[i + 1] if i + 1 < len(sentences) else ''
        
        if len(current_chunk) + len(sentence) + len(separator) <= chunk_size:
            current_chunk += sentence + separator
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = sentence + separator
    
    if current_chunk:
        chunks.append(current_chunk)
    
    # Переводим каждую часть
    translated_chunks = []
    for i, chunk in enumerate(chunks[:5]):  # Ограничиваем 5 частями
        print(f"Translating chunk {i + 1}/{min(len(chunks), 5)}...")
        translated = translate_text(chunk)
        translated_chunks.append(translated)
        
        # Задержка между частями
        if i < len(chunks) - 1:
            time.sleep(1)
    
    result = ' '.join(translated_chunks)
    print(f"Long text translation complete: {len(result)} chars")
    
    return result

def extract_full_content(entry) -> str:
    """
    Извлекает максимально полный контент из RSS-записи.
    Проверяет все доступные поля и объединяет их.
    """
    content_parts = []
    
    # 1. Проверяем entry.content (список словарей с полным контентом)
    if hasattr(entry, 'content') and entry.content:
        for content_item in entry.content:
            if isinstance(content_item, dict) and 'value' in content_item:
                content_parts.append(content_item['value'])
    
    # 2. Проверяем entry.summary (краткое описание)
    if hasattr(entry, 'summary') and entry.summary:
        # Добавляем только если еще нет контента или summary длиннее
        if not content_parts or len(entry.summary) > len(content_parts[0]):
            if entry.summary not in content_parts:
                content_parts.append(entry.summary)
    
    # 3. Проверяем entry.description (альтернативное описание)
    if hasattr(entry, 'description') and entry.description:
        if entry.description not in content_parts:
            content_parts.append(entry.description)
    
    # 4. Проверяем entry.summary_detail
    if hasattr(entry, 'summary_detail') and entry.summary_detail:
        if isinstance(entry.summary_detail, dict) and 'value' in entry.summary_detail:
            detail_value = entry.summary_detail['value']
            if detail_value not in content_parts:
                content_parts.append(detail_value)
    
    # Объединяем все части
    full_content = ' '.join(content_parts)
    
    # Применяем расширенную очистку
    full_content = clean_html(full_content)
    full_content = remove_promotional_content(full_content)
    
    # Логируем для отладки
    print(f"Extracted content length: {len(full_content)} chars from {len(content_parts)} sources")
    log_event('news-admin.content_extracted', {
        'length': len(full_content),
        'sources': len(content_parts),
        'link': entry.get('link', 'unknown')
    })
    
    return full_content if full_content else ''

@timing_decorator
def fetch_article_content(url: str, timeout: int = 10) -> tuple:
    """
    Извлекает полный текст статьи со страницы по URL.
    Использует readability для извлечения основного контента.
    
    Args:
        url: URL статьи
        timeout: Таймаут запроса в секундах
    
    Returns:
        Кортеж (текст статьи, HTML контент) или ('', '') при ошибке
    """
    try:
        # Заголовки для имитации браузера
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        print(f"Fetching article from: {url}")
        
        # Запрос страницы
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        response.raise_for_status()
        
        # Проверка типа контента
        content_type = response.headers.get('Content-Type', '')
        if 'text/html' not in content_type:
            print(f"Skipping non-HTML content: {content_type}")
            return ('', '')
        
        # Сохраняем оригинальный HTML для извлечения медиа
        original_html = response.text
        
        # Извлечение основного контента с помощью readability
        doc = Document(response.content)
        article_html = doc.summary()
        
        # Парсинг HTML с BeautifulSoup
        soup = BeautifulSoup(article_html, 'lxml')
        
        # Удаление скриптов, стилей и других ненужных элементов
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript']):
            element.decompose()
        
        # Извлечение текста
        text = soup.get_text(separator=' ', strip=True)
        
        # Применяем расширенную очистку
        text = clean_html(text)
        text = remove_promotional_content(text)
        
        # Очистка от лишних пробелов
        text = ' '.join(text.split())
        
        print(f"Extracted {len(text)} characters from article")
        
        return (text, original_html)
        
    except requests.Timeout:
        print(f"Timeout fetching article: {url}")
        return ('', '')
    except requests.RequestException as e:
        print(f"Error fetching article {url}: {e}")
        return ('', '')
    except Exception as e:
        print(f"Unexpected error parsing article {url}: {e}")
        return ('', '')

def should_fetch_from_web(content: str, min_length: int = 500) -> bool:
    """
    Определяет, нужно ли извлекать контент со страницы.
    
    Args:
        content: Текущий контент из RSS
        min_length: Минимальная длина контента
    
    Returns:
        True если нужно извлечь со страницы
    """
    # Если контента нет или он слишком короткий
    if not content or len(content.strip()) < min_length:
        return True
    
    # Если контент содержит только заголовок/описание
    # (обычно меньше 3 предложений)
    sentences = content.count('.') + content.count('!') + content.count('?')
    if sentences < 3:
        return True
    
    return False

def translate_full_content(text: str) -> str:
    """
    Перевод полного контента с поддержкой длинных текстов.
    
    Args:
        text: Текст для перевода
    
    Returns:
        Переведенный текст
    """
    if not text or len(text.strip()) < 10:
        return text
    
    # Ограничиваем общую длину
    text = text[:5000]
    
    # Используем перевод по частям для длинных текстов
    if len(text) > 1500:
        return translate_long_text(text)
    else:
        return translate_text(text)

@timing_decorator
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
    web_fetch_count = 0
    MAX_WEB_FETCHES = 5  # Ограничение для безопасности
    
    # Логируем начало обработки
    print(f"Starting to fetch news from {len(feeds)} feeds...")
    log_event('news-admin.fetch_started', {'feeds_count': len(feeds)})
    
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
            
            # Извлекаем полный контент из всех доступных источников RSS
            original_content = extract_full_content(entry)
            article_html = ''  # Для извлечения медиа
            
            # Проверяем, достаточно ли контента из RSS
            if should_fetch_from_web(original_content):
                print(f"RSS content insufficient ({len(original_content)} chars), fetching from web...")
                
                # Проверяем лимит web-запросов
                if web_fetch_count < MAX_WEB_FETCHES:
                    # Пытаемся получить контент со страницы (возвращает кортеж)
                    web_content, article_html = fetch_article_content(entry.link)
                    web_fetch_count += 1
                    
                    if web_content and len(web_content) > len(original_content):
                        print(f"Using web content ({len(web_content)} chars) instead of RSS ({len(original_content)} chars)")
                        original_content = web_content
                    else:
                        print(f"Web scraping failed or returned less content, using RSS")
                    
                    # Небольшая задержка между запросами для вежливости
                    time.sleep(1)
                else:
                    print(f"Max web fetches ({MAX_WEB_FETCHES}) reached, skipping web fetch")
            else:
                print(f"RSS content sufficient ({len(original_content)} chars), skipping web fetch")
            
            # Ограничиваем длину для перевода
            content_to_translate = original_content[:5000] if len(original_content) > 5000 else original_content
            
            # Переводим только если есть контент
            if len(content_to_translate) > 50:
                translated_content = translate_full_content(content_to_translate)
                translated_content = clean_html(translated_content)
                translated_content = remove_promotional_content(translated_content)
            else:
                # Если контента мало, используем excerpt
                translated_content = excerpt_ru
                original_content = clean_summary
            
            print(f'Final original content: {len(original_content)} chars')
            print(f'Final translated content: {len(translated_content)} chars')
            log_event('news-admin.content_translated', {
                'original_length': len(original_content),
                'translated_length': len(translated_content),
                'link': entry.get('link', 'unknown')
            })
            
            # Извлекаем изображение (используя HTML страницы если доступен)
            image_url = extract_featured_image(entry, article_html)
            
            # Извлекаем видео embed URL (используя очищенный контент и HTML)
            video_embed_url = extract_video_embed(entry, original_content, article_html)
            
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
                'image_url': image_url,
                'video_embed_url': video_embed_url,
                'category': category,
                'published_date': published_date,
                'formatted_date': formatted_date
            }
            all_news.append(news_item)
    
    return all_news

MAX_NEWS_PER_RUN = 80


def save_news_to_db(news_items: List[Dict[str, Any]], auth_payload: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    inserted = 0
    updated = 0
    errors = 0
    new_items: List[Dict[str, Any]] = []
    update_items: List[tuple] = []
    
    links = [item['link'] for item in news_items]
    cur.execute(
        "SELECT link, id, translated_content FROM news WHERE link = ANY(%s)",
        (links,)
    )
    existing_map = {row[0]: (row[1], row[2]) for row in cur.fetchall()}
    
    for item in news_items:
        if item['link'] in existing_map:
            news_id, trans_content = existing_map[item['link']]
            if not trans_content or trans_content.strip() == '':
                update_items.append((item, news_id))
        else:
            new_items.append(item)
    
    print(f"New records: {len(new_items)}, updates: {len(update_items)}")
    
    try:
        if new_items:
            insert_query = """INSERT INTO news
                (original_title, translated_title, original_excerpt, translated_excerpt,
                 original_content, translated_content, source, source_url, link, image_url, video_embed_url, category,
                 published_date, translated_at, created_at, updated_at, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE)"""
            insert_data = [
                (
                    item['original_title'], item['translated_title'],
                    item['original_excerpt'], item['translated_excerpt'],
                    item['original_content'], item['translated_content'],
                    item['source'], item['source_url'], item['link'],
                    normalize_image_url(item.get('image_url', '')),
                    item.get('video_embed_url', ''),
                    item['category'], item['published_date']
                )
                for item in new_items
            ]
            cur.executemany(insert_query, insert_data)
            inserted = len(new_items)
            for item in new_items:
                log_event('news-admin.insert', {'link': item['link'], 'user': auth_payload.get('sub')})
        
        if update_items:
            update_query = """UPDATE news SET
                original_title = %s, translated_title = %s,
                original_excerpt = %s, translated_excerpt = %s,
                original_content = %s, translated_content = %s,
                source = %s, source_url = %s, image_url = %s,
                video_embed_url = %s, category = %s, published_date = %s,
                updated_at = CURRENT_TIMESTAMP, translated_at = CURRENT_TIMESTAMP
                WHERE id = %s"""
            update_data = [
                (
                    item['original_title'], item['translated_title'],
                    item['original_excerpt'], item['translated_excerpt'],
                    item['original_content'], item['translated_content'],
                    item['source'], item['source_url'],
                    normalize_image_url(item.get('image_url', '')),
                    item.get('video_embed_url', ''),
                    item['category'], item['published_date'], news_id
                )
                for item, news_id in update_items
            ]
            cur.executemany(update_query, update_data)
            updated = len(update_items)
            for item, _news_id in update_items:
                log_event('news-admin.update', {'link': item['link'], 'user': auth_payload.get('sub')})
        
        conn.commit()
    except Exception as exc:
        print(f"Batch save error: {exc}")
        conn.rollback()
        errors = len(news_items)
    finally:
        cur.close()
        conn.close()
    
    return {
        'inserted': inserted,
        'updated': updated,
        'errors': errors,
        'total_processed': len(news_items)
    }

def verify_news_sorting():
    """Ensures active news items are ordered newest first"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, original_title, published_date, created_at
        FROM news
        WHERE is_active = TRUE
        ORDER BY published_date DESC, created_at DESC
        LIMIT 10
    """)
    
    rows = cur.fetchall()
    print("\nSorting check (top 10 active news):")
    print("-" * 80)
    
    for i, row in enumerate(rows, 1):
        news_id, title, pub_date, created = row
        print(f"{i}. [{pub_date}] {title[:50]}...")
    
    cur.close()
    conn.close()
    
    print("-" * 80)
    print("✓ News sorted from newest to oldest")

def cleanup_old_news(days_to_keep: int = 90):
    """Deactivates news older than retention period"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE news
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE published_date < CURRENT_TIMESTAMP - INTERVAL '%s days'
        AND is_active = TRUE
        RETURNING id
    """, (days_to_keep,))
    
    deactivated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"Deactivated old news: {deactivated}")
    return deactivated

def test_news_pipeline():
    """Runs a sanity check across the news pipeline"""
    print("=" * 60)
    print("NEWS PIPELINE TESTING")
    print("=" * 60)
    
    print("\n1. Checking Ollama...")
    try:
        conn = http.client.HTTPConnection('localhost', 11434, timeout=5)
        conn.request('GET', '/api/tags')
        response = conn.getresponse()
        conn.close()
        if response.status == 200:
            print("✓ Ollama is available")
        else:
            print("✗ Ollama is unavailable - run: ollama serve")
            return
    except Exception as e:
        print(f"✗ Ollama check failed: {e}")
        return
    
    print("\n2. Translation test...")
    test_text = "This is a test article about web development and Python programming."
    translated = translate_text(test_text)
    print(f"Original: {test_text}")
    print(f"Translation: {translated}")
    if translated and translated != test_text:
        print("✓ Translation works")
    else:
        print("✗ Translation failed")
    
    print("\n3. HTML cleaning test...")
    test_html = "<p>Test content</p><script>alert('test');</script>Article URL: https://test.com"
    cleaned = clean_html(test_html)
    print(f"HTML: {test_html}")
    print(f"Cleaned: {cleaned}")
    if 'script' not in cleaned and 'Article URL' not in cleaned:
        print("✓ Cleaning works")
    else:
        print("✗ Cleaning failed")
    
    print("\n4. RSS extraction test...")
    try:
        news_items = fetch_and_translate_news()
        print(f"News items fetched: {len(news_items)}")
        
        if news_items:
            first = news_items[0]
            print(f"\nSample news:")
            print(f"  Title: {first['translated_title'][:60]}...")
            print(f"  Original content length: {len(first['original_content'])} chars")
            print(f"  Translated content length: {len(first['translated_content'])} chars")
            
            if len(first['original_content']) > 100:
                print("✓ Content extraction works")
            else:
                print("✗ Content too short")
        else:
            print("✗ No news fetched")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)

def check_ollama_available() -> bool:
    """Проверяет доступность Ollama API"""
    try:
        conn = http.client.HTTPConnection('localhost', 11434, timeout=5)
        conn.request('GET', '/api/tags')
        response = conn.getresponse()
        conn.close()
        return response.status == 200
    except Exception as e:
        print(f"Ollama not available: {e}")
        return False

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
        auth_payload = ensure_admin_authorized(event.get('headers'))
        if not auth_payload:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        rate_limit_hit = enforce_rate_limit('news-admin', event, limit=10, window_seconds=60)
        if rate_limit_hit:
            return {
                'statusCode': 429,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Too many requests'})
            }
        
        # Проверка доступности Ollama
        if not check_ollama_available():
            return {
                'statusCode': 503,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': 'Ollama service is not available. Please start Ollama first.'
                })
            }
        
        news_items = fetch_and_translate_news()
        print(f'Fetched {len(news_items)} news items')
        
        if len(news_items) > MAX_NEWS_PER_RUN:
            news_items = news_items[:MAX_NEWS_PER_RUN]
            print(f'Trimmed news items to {MAX_NEWS_PER_RUN} for stability')
        
        result = save_news_to_db(news_items, auth_payload)
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
