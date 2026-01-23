# Диагностика Telegram для consent/contact-form

Ниже — список запросов для воспроизведения и получения симптомов. Все запросы направляются на публичный API `/api/{uuid}` согласно [`backend/func2url.json`](backend/func2url.json:1).

## 1) Consent (POST)
**UUID:** `/api/80536dd3-4799-47a9-893a-a756a259460e` из [`plans/recommendations/consent.md`](plans/recommendations/consent.md:3) и [`backend/func2url.json`](backend/func2url.json:23)

### cURL
```bash
curl -i -X POST "https://<ваш-домен>/api/80536dd3-4799-47a9-893a-a756a259460e" \
  -H "Content-Type: application/json" \
  -H "Origin: https://<ваш-домен>" \
  -d '{
    "fullName": "Тест Пользователь",
    "phone": "+7 (999) 111-22-33",
    "email": "test@example.com",
    "cookies": true,
    "terms": true,
    "privacy": true,
    "botField": ""
  }'
```

### Ожидаемый ответ
HTTP 200, `success: true`, поле `telegram_sent` должно быть `true`.

## 2) Consent (GET)
**UUID:** `/api/80536dd3-4799-47a9-893a-a756a259460e`

### cURL
```bash
curl -i "https://<ваш-домен>/api/80536dd3-4799-47a9-893a-a756a259460e"
```

### Ожидаемый ответ
HTTP 200 и список `consents`.

## 3) Contact Form (POST)
**UUID:** `/api/003b9991-d7d8-4f5d-8257-dee42fad0f91` из [`plans/recommendations/contact-form.md`](plans/recommendations/contact-form.md:3) и [`backend/func2url.json`](backend/func2url.json:12)

### cURL
```bash
curl -i -X POST "https://<ваш-домен>/api/003b9991-d7d8-4f5d-8257-dee42fad0f91" \
  -H "Content-Type: application/json" \
  -H "Origin: https://<ваш-домен>" \
  -d '{
    "name": "Тест Пользователь",
    "phone": "+7 (999) 111-22-33",
    "email": "test@example.com",
    "type": "contact_form",
    "timestamp": "2026-01-22T13:00:00Z",
    "botField": ""
  }'
```

### Ожидаемый ответ
HTTP 200, `success: true`, поле `telegram` должно быть `true`.

## 4) Проверка секретов (косвенная)
Если `telegram=false` или `telegram_sent=false`, это часто означает, что отсутствуют `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` либо не читаются из БД.

### Где читаются секреты
- Consent использует `get_secret` из [`backend/_shared/db_secrets.py`](backend/_shared/db_secrets.py:1) (не читался в этом шаге, но логика есть в [`backend/consent/index.py`](backend/consent/index.py:56)).
- Contact-form читает секреты через `get_secret` в [`backend/contact-form/index.py`](backend/contact-form/index.py:20).

## 5) Логи pm2 (диагностика ошибки Telegram)
Проверять события:
- `consent_telegram_retry_error`
- `consent_telegram_spawn_error`
- `contact_form_telegram_error`

Команда для последних 200 строк:
```bash
pm2 logs api --lines 200
```

## 6) Типичные причины отказа
1. Неверные/пустые `TELEGRAM_BOT_TOKEN` или `TELEGRAM_CHAT_ID`.
2. Проблемы с чтением секретов из БД (ошибка подключения/нет значения в `secure_settings`).
3. Проблемы Origin/Rate-limit (получите HTTP 403/429).
4. Изменения в сетевом доступе до `api.telegram.org`.

## 7) Что собрать после выполнения
1. Ответы API с кодом и телом для пунктов 1 и 3.
2. Вырезку логов pm2 за момент запросов.
3. Подтверждение, где хранятся секреты (env или `secure_settings`).
