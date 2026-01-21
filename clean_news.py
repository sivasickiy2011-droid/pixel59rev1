#!/usr/bin/env python3
import os
import re
from html import unescape
import psycopg2

def clean_html(text: str) -> str:
    if not text:
        return text
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

def main():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        dsn = 'postgresql://pixel_user:strong_password_123@localhost:5432/pixel_db'
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Получить все новости
    cur.execute("SELECT id, original_content, translated_content FROM news")
    rows = cur.fetchall()
    
    updated = 0
    for row in rows:
        id_, orig, trans = row
        orig_clean = clean_html(orig) if orig else ''
        trans_clean = clean_html(trans) if trans else ''
        
        if orig != orig_clean or trans != trans_clean:
            cur.execute("""
                UPDATE news 
                SET original_content = %s, translated_content = %s
                WHERE id = %s
            """, (orig_clean, trans_clean, id_))
            updated += 1
            print(f'Updated news {id_}')
    
    conn.commit()
    cur.close()
    conn.close()
    print(f'Total updated: {updated}')

if __name__ == '__main__':
    main()