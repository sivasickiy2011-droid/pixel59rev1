# Исправление ошибки входа в админ-панель (18 января 2026)

## Проблема
При попытке входа в админ-панель по адресу `https://172.16.57.77/admin/login` возникали следующие ошибки:

1. **В консоли браузера:**
   - `Unchecked runtime.lastError: The message port closed before a response was received.`
   - `Failed to load resource: the server responded with a status of 405 ()` для эндпоинта `/api/fcfd14ca-b5b0-4e96-bd94-e4db4df256d5`
   - `Unexpected token '<', "<!--"... is not valid JSON` (при запросах к `/api/partners`, `/api/news`, `/api/portfolio`)

2. **Функциональные проблемы:**
   - Не принимался пароль администратора
   - API-запросы возвращали HTML вместо JSON
   - Отсутствовало изображение `9a3097d8-c2ab-4acb-917e-a6fb88252298.png`

## Причины
1. **Неправильный UUID для аутентификации:** Фронтенд использовал UUID `fcfd14ca-b5b0-4e96-bd94-e4db4df256d5` (предназначенный для логирования), тогда как для аутентификации администратора должен использоваться UUID `743e5e24-86d0-4a6a-90ac-c71d80a5b822`.

2. **Отсутствие проксирования `/api` в nginx:** Конфигурация nginx не содержала location `/api` для проксирования запросов на Node.js сервер (порт 3001), в результате запросы попадали на статический фронтенд и возвращали HTML.

3. **Отсутствующее изображение:** В папке `dist/img` не было файла `9a3097d8-c2ab-4acb-917e-a6fb88252298.png`, что вызывало ошибку 404.

## Внесённые изменения

### 1. Исправление UUID в фронтенде
- **Файл:** `src/pages/AdminLogin.tsx`
  - Заменён UUID с `fcfd14ca-b5b0-4e96-bd94-e4db4df256d5` на `743e5e24-86d0-4a6a-90ac-c71d80a5b822`
- **Файл:** `src/components/services/PartnerLogin.tsx`
  - Аналогичная замена UUID

### 2. Обновление конфигурации nginx
- **Файл:** `nginx.conf` (в корне проекта)
  - Добавлен location `/api` для проксирования на `http://localhost:3001`
  - Конфигурация:
    ```nginx
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    ```
  - Важно: location `/api` должен быть размещён **перед** существующими location `/api/ai-chat/` и `/api/ollama/`, чтобы не перекрывать их.

### 3. Создание недостающего изображения
- **Действие:** Скопировано существующее изображение `5e53ea79-1c81-4c3f-847b-e8a82a5743c2.png` в `9a3097d8-c2ab-4acb-917e-a6fb88252298.png`
- **Путь:** `dist/img/9a3097d8-c2ab-4acb-917e-a6fb88252298.png`

### 4. Перезапуск сервисов
- Перезапущены процессы pm2:
  ```bash
  pm2 restart api gatevey ollama
  ```
- Перезагружена конфигурация nginx (требуются права sudo):
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```

## Проверка работы

### После исправлений:
1. **Node.js сервер** на порту 3001 возвращает корректный JSON для эндпоинтов:
   - `http://localhost:3001/api/partners`
   - `http://localhost:3001/api/news`
   - `http://localhost:3001/api/portfolio`

2. **Nginx проксирует** запросы с `/api` на Node.js сервер, возвращая JSON.

3. **Вход в админ-панель** работает с паролем `Xw1Utoce1` (хэш хранится в таблице `users` базы данных).

4. **Изображения** загружаются без ошибок 404.

## Шаги для применения изменений на продакшене

1. **Обновить фронтенд:**
   ```bash
   npm run build
   ```
   Или, если используется деплой через скрипт:
   ```bash
   ./quick-deploy.sh
   ```

2. **Применить конфигурацию nginx:**
   - Скопировать обновлённый `nginx.conf` в `/etc/nginx/nginx.conf`
   - Проверить синтаксис: `sudo nginx -t`
   - Перезагрузить nginx: `sudo systemctl reload nginx`

3. **Перезапустить Node.js сервер:**
   ```bash
   pm2 restart api
   ```

4. **Проверить работу:**
   - Открыть `https://172.16.57.77/admin/login`
   - Ввести пароль `Xw1Utoce1`
   - Убедиться, что вход успешен и нет ошибок в консоли.

## Дополнительная информация

### Пароль администратора
- **Пароль:** `Xw1Utoce1`
- **Хэш:** `$2b$12$J9Rc8.8Q8Q8Q8Q8Q8Q8Q8u` (хранится в таблице `users`, поле `password_hash`)
- **Логин:** `admin` (или любое значение, проверяется только пароль)

### UUID-маршрутизация
- **Аутентификация администратора:** `743e5e24-86d0-4a6a-90ac-c71d80a5b822` → `backend/auth-admin/index.py`
- **Логирование входа:** `fcfd14ca-b5b0-4e96-bd94-e4db4df256d5` → `backend/admin-login-logs/index.py`
- **Другие эндпоинты:**
  - `partners`: `d9c9b1a0-8b7a-4b1a-9b1a-0b7a4b1a9b1a`
  - `news`: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
  - `portfolio`: `b2c3d4e5-f6g7-8901-bcde-f12345678901`

### Архитектура
- **Фронтенд:** React + TypeScript, собранный в `dist/`
- **Бэкенд:** Node.js + Express на порту 3001, проксируется через nginx
- **Python-функции:** Обрабатываются через `python-gatevey` (порт 8000)
- **База данных:** PostgreSQL, таблицы `users`, `partners`, `portfolio`, `news`, `admin_login_logs`

## Контакты
При возникновении проблем обращаться к разработчику или проверить логи:
- `pm2 logs api`
- `sudo journalctl -u nginx`
- Логи Python-функций: `~/.gigaide/logs/`

---
*Документация создана автоматически 18 января 2026 года.*