# Промпт: Этап 1 - Создание публичного API для партнёров

**Этап:** 1 из 5  
**Приоритет:** Высокий  
**Оценка:** ~50 строк кода  
**Лимит контекста:** 200k токенов

---

## Контекст задачи

В проекте есть админский endpoint для управления логотипами партнёров (`/api/c7b03587-cdba-48a4-ac48-9aa2775ff9a0`), но отсутствует публичный endpoint для отображения логотипов на главной странице сайта.

Компонент `PartnersCarousel.tsx` пытается получить данные с `/api/partners`, но этот endpoint не существует в backend.

## Цель этапа

Создать публичный API endpoint `/api/partners` для получения списка активных партнёров без требования авторизации.

## Технические требования

### 1. Создать файл `backend/partners/index.py`

**Путь:** `backend/partners/index.py`

**Функционал:**
- Обработка GET запросов без авторизации
- Возврат только активных партнёров (`is_active = true`)
- Сортировка по `sort_order ASC`
- Маппинг полей БД на frontend формат

**Структура БД (таблица `partners`):**
```
id          | integer   | NOT NULL
name        | varchar   | NOT NULL
logo_url    | varchar   | NULL
website     | varchar   | NULL
sort_order  | integer   | NULL
is_active   | boolean   | NULL
created_at  | timestamp | NULL
```

**Маппинг полей:**
- `website` (БД) → `website_url` (API)
- `sort_order` (БД) → `display_order` (API)

**Формат ответа:**
```json
[
  {
    "id": 1,
    "name": "Яндекс",
    "logo_url": "/uploads/logos/uuid-123.png",
    "website_url": "https://yandex.ru",
    "display_order": 1,
    "is_active": true
  }
]
```

### 2. Обновить `backend/func2url.json`

Добавить маппинг:
```json
"partners": "/api/3f1e2a11-15ea-463e-9cec-11697b90090c"
```

**Важно:** UUID `3f1e2a11-15ea-463e-9cec-11697b90090c` уже существует в файле, используй его.

### 3. Обработка ошибок

- Обработка ошибок подключения к БД
- Возврат пустого массива при отсутствии партнёров
- CORS заголовки для всех ответов

## Пример кода

### Структура файла `backend/partners/index.py`

```python
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Public API для получения списка активных партнёров
    Args: event с httpMethod='GET'
    Returns: HTTP response со списком партнёров
    '''
    method = event.get('httpMethod', 'GET')
    
    # CORS preflight
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
    
    # Только GET метод
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
    
    # Подключение к БД
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        # Получить только активные партнёры, отсортированные по порядку
        cur.execute('''
            SELECT id, name, logo_url, website, sort_order, is_active, created_at
            FROM partners
            WHERE is_active = true
            ORDER BY sort_order ASC
        ''')
        
        rows = cur.fetchall()
        
        # Маппинг на frontend формат
        partners = []
        for row in rows:
            partners.append({
                'id': row[0],
                'name': row[1],
                'logo_url': row[2],
                'website_url': row[3],  # website → website_url
                'display_order': row[4],  # sort_order → display_order
                'is_active': row[5]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300'  # Кэш на 5 минут
            },
            'body': json.dumps(partners),
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
```

## Критерии приёмки

После выполнения этого этапа должно работать:

1. ✅ GET запрос к `/api/partners` возвращает список партнёров
2. ✅ Возвращаются только партнёры с `is_active = true`
3. ✅ Партнёры отсортированы по `sort_order ASC`
4. ✅ Не требуется авторизация (X-Admin-Token)
5. ✅ CORS заголовки настроены корректно
6. ✅ Поля маппятся правильно: `website` → `website_url`, `sort_order` → `display_order`
7. ✅ При отсутствии партнёров возвращается пустой массив `[]`
8. ✅ Обработаны все ошибки (БД, сеть и т.д.)

## Тестирование

### Тест 1: Получение списка партнёров

**Запрос:**
```bash
curl -X GET http://localhost:8000/api/partners
```

**Ожидаемый ответ:**
```json
[
  {
    "id": 1,
    "name": "Партнёр 1",
    "logo_url": "/uploads/logos/logo1.png",
    "website_url": "https://example.com",
    "display_order": 1,
    "is_active": true
  }
]
```

### Тест 2: Проверка фильтрации неактивных

Если в БД есть партнёр с `is_active = false`, он НЕ должен появиться в ответе.

### Тест 3: Проверка сортировки

Партнёры должны быть отсортированы по `display_order` от меньшего к большему.

### Тест 4: CORS

**Запрос:**
```bash
curl -X OPTIONS http://localhost:8000/api/partners \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
```

**Ожидаемый ответ:**
- Статус: 200
- Заголовок `Access-Control-Allow-Origin: *`

## Файлы для изменения

1. **Создать:** `backend/partners/index.py`
2. **Проверить:** `backend/func2url.json` (маппинг уже должен быть)

## Зависимости

- PostgreSQL база данных с таблицей `partners`
- Переменная окружения `DATABASE_URL`
- Библиотека `psycopg2`

## Следующий этап

После успешного выполнения этого этапа переходи к **Этапу 2: Интеграция загрузки изображений**.

---

## Промпт для ИИ агента

```
Создай публичный API endpoint для получения списка активных партнёров.

ЗАДАЧА:
1. Создай файл backend/partners/index.py с функцией handler
2. Реализуй GET метод без авторизации
3. Верни только активные партнёры (is_active = true)
4. Отсортируй по sort_order ASC
5. Маппинг полей: website → website_url, sort_order → display_order
6. Добавь CORS заголовки
7. Обработай все ошибки

БАЗА ДАННЫХ:
- Таблица: partners
- Поля: id, name, logo_url, website, sort_order, is_active, created_at
- Подключение: os.environ.get('DATABASE_URL')

ФОРМАТ ОТВЕТА:
[
  {
    "id": 1,
    "name": "Партнёр",
    "logo_url": "/uploads/logos/logo.png",
    "website_url": "https://example.com",
    "display_order": 1,
    "is_active": true
  }
]

КРИТЕРИИ:
- Только GET метод
- Без авторизации
- Фильтр: is_active = true
- Сортировка: sort_order ASC
- CORS: Access-Control-Allow-Origin: *
- Кэш: Cache-Control: public, max-age=300

ФАЙЛЫ:
- Создать: backend/partners/index.py
- Проверить: backend/func2url.json (должен быть маппинг "partners": "/api/3f1e2a11-15ea-463e-9cec-11697b90090c")

После создания протестируй endpoint запросом:
curl -X GET http://localhost:8000/api/partners
```
