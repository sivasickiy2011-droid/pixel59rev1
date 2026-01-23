# Промпт для Этапа 2: База данных и Backend API

**Этап:** 2 из 5  
**Контекст:** До 200,000 токенов  
**Предыдущие результаты:** `stage1-results.md` (список компонентов с BEM-классами)

---

## 📋 Контекст проекта

### Входные данные из Этапа 1
Прочитайте файл `stage1-results.md` для получения:
- Списка всех компонентов с BEM-классами
- Структуры CSS-классов по компонентам
- Особенностей каждого компонента

### Текущая инфраструктура
- **База данных:** PostgreSQL (pixel_db)
- **Backend:** Python serverless functions
- **Существующие таблицы:** users, partners, contacts, settings, news, portfolio, services, и др.
- **Подключение:** `postgresql://pixel_user:strong_password_123@localhost:5432/pixel_db`

---

## 🎯 Задача этапа

Создать базу данных и Backend API для управления динамическими CSS правилами.

### Подзадачи:
1. Создать SQL миграции для новых таблиц
2. Разработать Python API для CRUD операций
3. Реализовать валидацию и санитизацию CSS
4. Добавить систему версионирования изменений
5. Создать тесты для API

---

## 🗄️ Структура базы данных

### Таблица 1: `custom_css_blocks`

```sql
-- Основная таблица для хранения CSS блоков
CREATE TABLE IF NOT EXISTS custom_css_blocks (
    id SERIAL PRIMARY KEY,
    block_name VARCHAR(100) UNIQUE NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    css_content TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    description TEXT,
    
    CONSTRAINT block_name_format CHECK (block_name ~ '^[a-z0-9-_]+$'),
    CONSTRAINT component_name_format CHECK (component_name ~ '^[A-Za-z0-9]+$')
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_custom_css_blocks_block_name ON custom_css_blocks(block_name);
CREATE INDEX idx_custom_css_blocks_component_name ON custom_css_blocks(component_name);
CREATE INDEX idx_custom_css_blocks_is_active ON custom_css_blocks(is_active);
CREATE INDEX idx_custom_css_blocks_priority ON custom_css_blocks(priority DESC);

-- Комментарии к таблице
COMMENT ON TABLE custom_css_blocks IS 'Хранение пользовательских CSS блоков для динамического применения';
COMMENT ON COLUMN custom_css_blocks.block_name IS 'Уникальное имя блока (например: about-us, development)';
COMMENT ON COLUMN custom_css_blocks.component_name IS 'Имя React компонента (например: AboutUs, Development)';
COMMENT ON COLUMN custom_css_blocks.css_content IS 'CSS код для блока';
COMMENT ON COLUMN custom_css_blocks.is_active IS 'Флаг активности блока';
COMMENT ON COLUMN custom_css_blocks.priority IS 'Приоритет применения (больше = выше приоритет)';
```

### Таблица 2: `css_change_history`

```sql
-- Таблица для хранения истории изменений CSS
CREATE TABLE IF NOT EXISTS css_change_history (
    id SERIAL PRIMARY KEY,
    block_id INTEGER NOT NULL REFERENCES custom_css_blocks(id) ON DELETE CASCADE,
    css_content_before TEXT,
    css_content_after TEXT NOT NULL,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_description TEXT,
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT valid_change CHECK (
        css_content_before IS DISTINCT FROM css_content_after
    )
);

-- Индексы
CREATE INDEX idx_css_history_block_id ON css_change_history(block_id);
CREATE INDEX idx_css_history_changed_at ON css_change_history(changed_at DESC);
CREATE INDEX idx_css_history_changed_by ON css_change_history(changed_by);

-- Комментарии
COMMENT ON TABLE css_change_history IS 'История изменений CSS блоков для аудита и отката';
COMMENT ON COLUMN css_change_history.block_id IS 'ID блока из custom_css_blocks';
COMMENT ON COLUMN css_change_history.css_content_before IS 'CSS код до изменения';
COMMENT ON COLUMN css_change_history.css_content_after IS 'CSS код после изменения';
```

### Триггер для автоматического обновления updated_at

```sql
-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер на таблицу custom_css_blocks
CREATE TRIGGER update_custom_css_blocks_updated_at
    BEFORE UPDATE ON custom_css_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Триггер для автоматического логирования изменений

```sql
-- Функция для логирования изменений CSS
CREATE OR REPLACE FUNCTION log_css_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.css_content IS DISTINCT FROM NEW.css_content THEN
        INSERT INTO css_change_history (
            block_id,
            css_content_before,
            css_content_after,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.css_content,
            NEW.css_content,
            NEW.created_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер
CREATE TRIGGER log_custom_css_changes
    AFTER UPDATE ON custom_css_blocks
    FOR EACH ROW
    EXECUTE FUNCTION log_css_changes();
```

---

## 🐍 Backend API

### Структура директории

```
backend/
├── css-management/
│   ├── index.py           # Главный файл с endpoints
│   ├── requirements.txt   # Зависимости
│   ├── tests.json        # Тесты
│   ├── validators.py     # Валидация CSS
│   └── sanitizer.py      # Санитизация CSS
```

### Файл: `backend/css-management/index.py`

```python
import json
import psycopg2
import psycopg2.extras
from datetime import datetime
import re
import sys
import os

# Добавляем путь к shared модулям
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '_shared'))

from db_secrets import get_db_connection
from security import verify_admin_token, sanitize_input
from logging import log_request

# Импорт валидаторов
from validators import validate_css_syntax, is_safe_css
from sanitizer import sanitize_css_content

def handler(event, context):
    """
    Главный обработчик для CSS Management API
    
    Endpoints:
    - GET /css-blocks - Получить все блоки
    - GET /css-blocks/:id - Получить блок по ID
    - GET /css-blocks/by-name/:name - Получить блок по имени
    - POST /css-blocks - Создать новый блок
    - PUT /css-blocks/:id - Обновить блок
    - DELETE /css-blocks/:id - Удалить блок
    - GET /css-blocks/active - Получить активные блоки
    - GET /css-blocks/:id/history - История изменений
    - POST /css-blocks/:id/rollback/:historyId - Откатить изменения
    """
    
    try:
        # Логирование запроса
        log_request(event)
        
        # Парсинг метода и пути
        method = event.get('httpMethod', 'GET')
        path = event.get('path', '')
        
        # Проверка авторизации (кроме GET /css-blocks/active)
        if not (method == 'GET' and '/active' in path):
            auth_header = event.get('headers', {}).get('Authorization', '')
            if not verify_admin_token(auth_header):
                return response(401, {'error': 'Unauthorized'})
        
        # Роутинг
        if method == 'GET' and path == '/css-blocks':
            return get_all_blocks(event)
        elif method == 'GET' and path == '/css-blocks/active':
            return get_active_blocks(event)
        elif method == 'GET' and '/css-blocks/' in path and '/history' in path:
            block_id = extract_id_from_path(path, '/css-blocks/', '/history')
            return get_block_history(block_id)
        elif method == 'GET' and '/css-blocks/by-name/' in path:
            block_name = path.split('/css-blocks/by-name/')[-1]
            return get_block_by_name(block_name)
        elif method == 'GET' and '/css-blocks/' in path:
            block_id = extract_id_from_path(path, '/css-blocks/')
            return get_block_by_id(block_id)
        elif method == 'POST' and path == '/css-blocks':
            return create_block(event)
        elif method == 'PUT' and '/css-blocks/' in path:
            block_id = extract_id_from_path(path, '/css-blocks/')
            return update_block(block_id, event)
        elif method == 'DELETE' and '/css-blocks/' in path:
            block_id = extract_id_from_path(path, '/css-blocks/')
            return delete_block(block_id)
        elif method == 'POST' and '/rollback/' in path:
            block_id = extract_id_from_path(path, '/css-blocks/', '/rollback/')
            history_id = path.split('/rollback/')[-1]
            return rollback_changes(block_id, history_id)
        else:
            return response(404, {'error': 'Endpoint not found'})
            
    except Exception as e:
        return response(500, {'error': str(e)})

def get_all_blocks(event):
    """Получить все CSS блоки"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Параметры фильтрации
    query_params = event.get('queryStringParameters', {}) or {}
    component_name = query_params.get('component')
    is_active = query_params.get('active')
    
    query = "SELECT * FROM custom_css_blocks WHERE 1=1"
    params = []
    
    if component_name:
        query += " AND component_name = %s"
        params.append(component_name)
    
    if is_active is not None:
        query += " AND is_active = %s"
        params.append(is_active == 'true')
    
    query += " ORDER BY priority DESC, component_name, block_name"
    
    cursor.execute(query, params)
    blocks = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return response(200, {
        'blocks': blocks,
        'count': len(blocks)
    })

def get_active_blocks(event):
    """Получить только активные блоки для применения на фронтенде"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute("""
        SELECT block_name, component_name, css_content, priority
        FROM custom_css_blocks
        WHERE is_active = true
        ORDER BY priority DESC
    """)
    
    blocks = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return response(200, {
        'blocks': blocks,
        'count': len(blocks),
        'timestamp': datetime.now().isoformat()
    })

def get_block_by_id(block_id):
    """Получить блок по ID"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute(
        "SELECT * FROM custom_css_blocks WHERE id = %s",
        (block_id,)
    )
    
    block = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not block:
        return response(404, {'error': 'Block not found'})
    
    return response(200, {'block': block})

def get_block_by_name(block_name):
    """Получить блок по имени"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute(
        "SELECT * FROM custom_css_blocks WHERE block_name = %s",
        (block_name,)
    )
    
    block = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not block:
        return response(404, {'error': 'Block not found'})
    
    return response(200, {'block': block})

def create_block(event):
    """Создать новый CSS блок"""
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON'})
    
    # Валидация обязательных полей
    required_fields = ['block_name', 'component_name', 'css_content']
    for field in required_fields:
        if field not in body:
            return response(400, {'error': f'Missing required field: {field}'})
    
    block_name = sanitize_input(body['block_name'])
    component_name = sanitize_input(body['component_name'])
    css_content = body['css_content']
    
    # Валидация CSS
    if not validate_css_syntax(css_content):
        return response(400, {'error': 'Invalid CSS syntax'})
    
    if not is_safe_css(css_content):
        return response(400, {'error': 'CSS contains potentially dangerous code'})
    
    # Санитизация CSS
    css_content = sanitize_css_content(css_content)
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        cursor.execute("""
            INSERT INTO custom_css_blocks 
            (block_name, component_name, css_content, is_active, priority, created_by, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            block_name,
            component_name,
            css_content,
            body.get('is_active', True),
            body.get('priority', 0),
            body.get('created_by', 'admin'),
            body.get('description', '')
        ))
        
        new_block = cursor.fetchone()
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return response(201, {
            'message': 'Block created successfully',
            'block': new_block
        })
        
    except psycopg2.IntegrityError as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return response(409, {'error': 'Block with this name already exists'})

def update_block(block_id, event):
    """Обновить CSS блок"""
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON'})
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Проверка существования блока
    cursor.execute("SELECT * FROM custom_css_blocks WHERE id = %s", (block_id,))
    existing_block = cursor.fetchone()
    
    if not existing_block:
        cursor.close()
        conn.close()
        return response(404, {'error': 'Block not found'})
    
    # Подготовка данных для обновления
    update_fields = []
    params = []
    
    if 'css_content' in body:
        css_content = body['css_content']
        
        # Валидация CSS
        if not validate_css_syntax(css_content):
            cursor.close()
            conn.close()
            return response(400, {'error': 'Invalid CSS syntax'})
        
        if not is_safe_css(css_content):
            cursor.close()
            conn.close()
            return response(400, {'error': 'CSS contains potentially dangerous code'})
        
        css_content = sanitize_css_content(css_content)
        update_fields.append("css_content = %s")
        params.append(css_content)
    
    if 'is_active' in body:
        update_fields.append("is_active = %s")
        params.append(body['is_active'])
    
    if 'priority' in body:
        update_fields.append("priority = %s")
        params.append(body['priority'])
    
    if 'description' in body:
        update_fields.append("description = %s")
        params.append(body['description'])
    
    if not update_fields:
        cursor.close()
        conn.close()
        return response(400, {'error': 'No fields to update'})
    
    params.append(block_id)
    
    query = f"""
        UPDATE custom_css_blocks 
        SET {', '.join(update_fields)}
        WHERE id = %s
        RETURNING *
    """
    
    cursor.execute(query, params)
    updated_block = cursor.fetchone()
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return response(200, {
        'message': 'Block updated successfully',
        'block': updated_block
    })

def delete_block(block_id):
    """Удалить CSS блок"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM custom_css_blocks WHERE id = %s RETURNING id", (block_id,))
    deleted = cursor.fetchone()
    
    if not deleted:
        cursor.close()
        conn.close()
        return response(404, {'error': 'Block not found'})
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return response(200, {'message': 'Block deleted successfully'})

def get_block_history(block_id):
    """Получить историю изменений блока"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute("""
        SELECT * FROM css_change_history
        WHERE block_id = %s
        ORDER BY changed_at DESC
        LIMIT 50
    """, (block_id,))
    
    history = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return response(200, {
        'history': history,
        'count': len(history)
    })

def rollback_changes(block_id, history_id):
    """Откатить изменения к определенной версии"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    # Получить версию из истории
    cursor.execute(
        "SELECT css_content_before FROM css_change_history WHERE id = %s AND block_id = %s",
        (history_id, block_id)
    )
    
    history_record = cursor.fetchone()
    
    if not history_record:
        cursor.close()
        conn.close()
        return response(404, {'error': 'History record not found'})
    
    # Откатить CSS
    cursor.execute("""
        UPDATE custom_css_blocks
        SET css_content = %s
        WHERE id = %s
        RETURNING *
    """, (history_record['css_content_before'], block_id))
    
    updated_block = cursor.fetchone()
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return response(200, {
        'message': 'Changes rolled back successfully',
        'block': updated_block
    })

def extract_id_from_path(path, prefix, suffix=''):
    """Извлечь ID из пути"""
    if suffix:
        return path.split(prefix)[1].split(suffix)[0]
    return path.split(prefix)[1].split('/')[0] if '/' in path.split(prefix)[1] else path.split(prefix)[1]

def response(status_code, body):
    """Формирование HTTP ответа"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body, default=str, ensure_ascii=False)
    }
```

### Файл: `backend/css-management/validators.py`

```python
import re
import cssutils
import logging

# Отключаем логи cssutils
cssutils.log.setLevel(logging.CRITICAL)

def validate_css_syntax(css_content):
    """
    Проверка синтаксиса CSS
    """
    try:
        cssutils.parseString(css_content)
        return True
    except Exception:
        return False

def is_safe_css(css_content):
    """
    Проверка CSS на потенциально опасные конструкции
    """
    # Список запрещенных паттернов
    dangerous_patterns = [
        r'javascript:',
        r'<script',
        r'expression\s*\(',
        r'@import\s+["\']https?://',  # Внешние импорты
        r'behavior\s*:',
        r'-moz-binding',
    ]
    
    css_lower = css_content.lower()
    
    for pattern in dangerous_patterns:
        if re.search(pattern, css_lower):
            return False
    
    return True

def validate_block_name(block_name):
    """
    Валидация имени блока
    """
    # Только буквы, цифры, дефисы и подчеркивания
    pattern = r'^[a-z0-9-_]+$'
    return bool(re.match(pattern, block_name))

def validate_component_name(component_name):
    """
    Валидация имени компонента
    """
    # PascalCase
    pattern = r'^[A-Z][A-Za-z0-9]*$'
    return bool(re.match(pattern, component_name))
```

### Файл: `backend/css-management/sanitizer.py`

```python
import re

def sanitize_css_content(css_content):
    """
    Санитизация CSS контента
    """
    # Удаление комментариев
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Удаление множественных пробелов
    css_content = re.sub(r'\s+', ' ', css_content)
    
    # Удаление пробелов вокруг специальных символов
    css_content = re.sub(r'\s*([{}:;,])\s*', r'\1', css_content)
    
    # Trim
    css_content = css_content.strip()
    
    return css_content

def minify_css(css_content):
    """
    Минификация CSS
    """
    # Удаление комментариев
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    
    # Удаление переносов строк
    css_content = re.sub(r'\n', '', css_content)
    
    # Удаление множественных пробелов
    css_content = re.sub(r'\s+', ' ', css_content)
    
    # Удаление пробелов вокруг специальных символов
    css_content = re.sub(r'\s*([{}:;,>+~])\s*', r'\1', css_content)
    
    # Удаление последней точки с запятой в блоке
    css_content = re.sub(r';}', '}', css_content)
    
    return css_content.strip()
```

### Файл: `backend/css-management/requirements.txt`

```
psycopg2-binary==2.9.9
cssutils==2.9.0
```

---

## ✅ Критерии выполнения

### База данных:
- [ ] Таблицы созданы успешно
- [ ] Индексы добавлены
- [ ] Триггеры работают
- [ ] Constraints валидируют данные

### Backend API:
- [ ] Все endpoints реализованы
- [ ] Валидация CSS работает
- [ ] Санитизация CSS работает
- [ ] История изменений логируется
- [ ] Откат изменений работает
- [ ] Авторизация проверяется

### Тестирование:
- [ ] Unit тесты написаны
- [ ] Integration тесты написаны
- [ ] API тесты пройдены

---

## 📄 Формат отчета

Создайте файл `stage2-results.md`:

```markdown
# Результаты Этапа 2: База данных и Backend API

## База данных

### Созданные таблицы
- ✅ custom_css_blocks
- ✅ css_change_history

### Миграции
- Файл: `db_migrations/2026-01-23_css_management.sql`
- Статус: Применена успешно

## Backend API

### Endpoints
- ✅ GET /css-blocks
- ✅ GET /css-blocks/:id
- ✅ GET /css-blocks/by-name/:name
- ✅ POST /css-blocks
- ✅ PUT /css-blocks/:id
- ✅ DELETE /css-blocks/:id
- ✅ GET /css-blocks/active
- ✅ GET /css-blocks/:id/history
- ✅ POST /css-blocks/:id/rollback/:historyId

### Тестирование
- Unit тесты: 15/15 пройдено
- Integration тесты: 8/8 пройдено
- API тесты: 12/12 пройдено

## Следующий этап
Переход к Этапу 3: Динамический загрузчик CSS
```

---

**Статус:** 🚀 Готов к выполнению  
**Следующий промпт:** `03-stage3-prompt.md`  
**Требуемые файлы из Этапа 1:** `stage1-results.md`
