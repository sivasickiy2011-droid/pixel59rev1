# Промпт: Этап 3 - Автоматическая сортировка и добавление карусели

**Этап:** 3 из 5  
**Приоритет:** Средний  
**Оценка:** ~100 строк кода  
**Лимит контекста:** 200k токенов

---

## Контекст задачи

Сейчас при создании партнёра нужно вручную указывать `display_order`, что неудобно. Также карусель логотипов не отображается на главной странице, хотя компонент существует.

## Цель этапа

1. Автоматически назначать `sort_order` при создании партнёра
2. Добавить карусель логотипов на главную страницу
3. Убрать поле `display_order` из формы создания

## Технические требования

### Часть 1: Автоматическая сортировка

#### 1. Обновить `backend/admin-partner-logos/index.py`

**Изменения в методе POST:**

```python
# Было:
display_order = body.get('display_order', 0)

# Стало:
# Автоматически вычислить следующий порядок
if 'display_order' not in body or body['display_order'] is None:
    cur.execute('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM partners')
    display_order = cur.fetchone()[0]
else:
    display_order = body['display_order']
```

**Полный код метода POST:**

```python
if method == 'POST':
    body = json.loads(event.get('body', '{}'))
    name = body.get('name')
    logo_url = body.get('logo_url')
    website_url = body.get('website_url')
    is_active = body.get('is_active', True)
    
    if not name or not logo_url or not website_url:
        cur.close()
        conn.close()
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Name, logo_url and website_url are required'}),
            'isBase64Encoded': False
        }
    
    # Автоматическое вычисление sort_order
    if 'display_order' not in body or body['display_order'] is None:
        cur.execute('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM partners')
        display_order = cur.fetchone()[0]
    else:
        display_order = body['display_order']
    
    cur.execute('''
        INSERT INTO partners
        (name, logo_url, website, sort_order, is_active)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, name, logo_url, website, sort_order, is_active, created_at
    ''', (name, logo_url, website_url, display_order, is_active))
    
    row = cur.fetchone()
    conn.commit()
    
    partner = {
        'id': row[0],
        'name': row[1],
        'logo_url': row[2],
        'website_url': row[3],
        'display_order': row[4],
        'is_active': row[5],
        'created_at': row[6].isoformat() if row[6] else None
    }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 201,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(partner),
        'isBase64Encoded': False
    }
```

#### 2. Обновить `src/components/admin/PartnerForm.tsx`

**Убрать поле "Порядок отображения" из формы создания:**

```typescript
// УДАЛИТЬ этот блок:
<div>
  <Label htmlFor="order" className="text-black">Порядок отображения</Label>
  <Input
    id="order"
    type="number"
    value={formData.display_order}
    onChange={(e) => onFormDataChange({ ...formData, display_order: parseInt(e.target.value) })}
    className="text-black"
  />
</div>
```

**Добавить информационное сообщение:**

```typescript
<div className="col-span-2">
  <p className="text-sm text-gray-500 italic">
    Порядок отображения будет назначен автоматически. 
    Вы сможете изменить его при редактировании.
  </p>
</div>
```

#### 3. Обновить `src/components/admin/PartnersAdmin.tsx`

**Изменить начальное значение `display_order` в `formData`:**

```typescript
const [formData, setFormData] = useState({
  name: '',
  logo_url: '',
  website_url: '',
  display_order: 0,  // Будет игнорироваться backend
  is_active: true
});
```

**Или убрать поле совсем:**

```typescript
const [formData, setFormData] = useState({
  name: '',
  logo_url: '',
  website_url: '',
  is_active: true
});
```

### Часть 2: Добавление карусели на главную страницу

#### 4. Обновить `src/pages/Index.tsx`

**Импортировать компонент:**

```typescript
import PartnersCarousel from '@/components/PartnersCarousel';
```

**Добавить в разметку (после Portfolio, перед FAQ):**

```typescript
const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <PartnerLogin />
      <Hero />
      
      <main>
        <HowItWorks />
        <AboutUs />
        <Development />
        <Promotion />
        <Services />
        <News />
        <Portfolio />
        <PartnersCarousel />  {/* ДОБАВИТЬ ЗДЕСЬ */}
        <FAQ />
        <Contacts />
      </main>

      <Footer />
      <CookieConsent />
      <FloatingChat />
    </div>
  );
};
```

**Альтернативная позиция (после Services, перед News):**

```typescript
<Services />
<PartnersCarousel />  {/* Или здесь */}
<News />
```

#### 5. Проверить `src/components/PartnersCarousel.tsx`

Убедиться, что компонент использует правильный endpoint:

```typescript
const response = await fetch(API_ENDPOINTS.partners.list);
```

Это должно соответствовать `/api/partners` из Этапа 1.

**Если нужно, обновить:**

```typescript
import { API_ENDPOINTS } from '../config/api';

// В useEffect:
const response = await fetch(API_ENDPOINTS.partners.list);
```

## Критерии приёмки

После выполнения этого этапа должно работать:

### Автоматическая сортировка:
1. ✅ При создании партнёра `sort_order` назначается автоматически
2. ✅ Новый партнёр получает `sort_order = MAX(sort_order) + 1`
3. ✅ Поле "Порядок отображения" убрано из формы создания
4. ✅ Можно изменить порядок при редактировании (поле остаётся в PartnerCard)
5. ✅ Партнёры отображаются в правильном порядке

### Карусель на главной:
6. ✅ Карусель отображается на главной странице
7. ✅ Логотипы загружаются из `/api/partners`
8. ✅ Анимация работает плавно
9. ✅ При клике на логотип открывается сайт партнёра
10. ✅ Отображаются только активные партнёры
11. ✅ Порядок соответствует `sort_order`

## Тестирование

### Тест 1: Автоматический порядок

1. Создать партнёра "Партнёр 1"
2. Не указывать порядок (поля нет в форме)
3. Сохранить
4. **Ожидаемый результат:** `sort_order = 1`

5. Создать партнёра "Партнёр 2"
6. Сохранить
7. **Ожидаемый результат:** `sort_order = 2`

### Тест 2: Изменение порядка

1. Открыть редактирование "Партнёр 2"
2. Изменить порядок на 0
3. Сохранить
4. **Ожидаемый результат:** 
   - "Партнёр 2" теперь первый
   - В карусели порядок изменился

### Тест 3: Карусель на главной

1. Создать 3+ активных партнёра
2. Открыть главную страницу
3. **Ожидаемый результат:**
   - Карусель видна
   - Логотипы анимируются
   - Порядок правильный
   - Клик работает

### Тест 4: Фильтрация неактивных

1. Создать партнёра с `is_active = false`
2. Открыть главную страницу
3. **Ожидаемый результат:**
   - Неактивный партнёр НЕ отображается в карусели
   - В админке он виден

### Тест 5: Пустая карусель

1. Деактивировать всех партнёров
2. Открыть главную страницу
3. **Ожидаемый результат:**
   - Карусель не отображается (return null)
   - Нет ошибок в консоли

## Файлы для изменения

1. **Обновить:** `backend/admin-partner-logos/index.py` (метод POST)
2. **Обновить:** `src/components/admin/PartnerForm.tsx` (убрать поле порядка)
3. **Обновить:** `src/components/admin/PartnersAdmin.tsx` (начальное значение formData)
4. **Обновить:** `src/pages/Index.tsx` (добавить PartnersCarousel)
5. **Проверить:** `src/components/PartnersCarousel.tsx` (endpoint)

## Позиционирование карусели

Рекомендуемые позиции на главной странице:

**Вариант 1 (рекомендуется):** После Portfolio, перед FAQ
```
Portfolio → PartnersCarousel → FAQ
```
Логика: Показываем работы, затем партнёров, затем вопросы

**Вариант 2:** После Services, перед News
```
Services → PartnersCarousel → News
```
Логика: Показываем услуги, затем партнёров, затем новости

**Вариант 3:** В самом низу, перед Footer
```
Contacts → PartnersCarousel → Footer
```
Логика: Партнёры как дополнительная информация

Выбери вариант, который лучше подходит для дизайна сайта.

## Следующий этап

После успешного выполнения этого этапа переходи к **Этапу 4: Улучшения UX и обработка ошибок**.

---

## Промпт для ИИ агента

```
Реализуй автоматическую сортировку партнёров и добавь карусель на главную страницу.

ЗАДАЧА 1: Автоматическая сортировка

1. Обнови backend/admin-partner-logos/index.py (метод POST):
   - Если display_order не указан, вычисли автоматически
   - SQL: SELECT COALESCE(MAX(sort_order), 0) + 1 FROM partners
   - Используй это значение для нового партнёра

2. Обнови src/components/admin/PartnerForm.tsx:
   - Убери поле "Порядок отображения" из формы
   - Добавь информационное сообщение: "Порядок будет назначен автоматически"

3. Обнови src/components/admin/PartnersAdmin.tsx:
   - Убери display_order из начального formData (или оставь 0)

ЗАДАЧА 2: Карусель на главной

4. Обнови src/pages/Index.tsx:
   - Импортируй PartnersCarousel
   - Добавь <PartnersCarousel /> после Portfolio, перед FAQ

5. Проверь src/components/PartnersCarousel.tsx:
   - Должен использовать API_ENDPOINTS.partners.list
   - Это должно быть /api/partners

КРИТЕРИИ:
- При создании sort_order назначается автоматически
- Поле порядка убрано из формы создания
- Можно изменить порядок при редактировании
- Карусель отображается на главной
- Логотипы загружаются и анимируются
- Только активные партнёры показываются

ТЕСТ:
1. Создай партнёра без указания порядка - должен получить sort_order = 1
2. Создай второго - должен получить sort_order = 2
3. Открой главную - карусель должна показывать оба логотипа
4. Деактивируй одного - в карусели должен остаться один
```
