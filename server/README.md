# Pixel API Server

Express.js API сервер для замены cloud functions.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установите зависимости
npm install

# Скопируйте .env файл
cp .env.example .env

# Отредактируйте .env (укажите параметры БД)
nano .env

# Запустите в режиме разработки
npm run dev
```

Сервер будет доступен на `http://localhost:3001`

### Production

```bash
# Установите зависимости
npm ci --only=production

# Запустите сервер
npm start
```

---

## 📁 Структура проекта

```
server/
├── api/                      # API endpoints
│   ├── auth.js              # Авторизация
│   ├── contact.js           # Контактная форма
│   └── portfolio.js         # Портфолио
├── config/                   # Конфигурация
│   ├── database.js          # PostgreSQL
│   └── s3.js                # MinIO/S3
├── middleware/               # Middleware
│   ├── auth.js              # JWT авторизация
│   └── cors.js              # CORS настройки
├── scripts/                  # Утилиты
│   └── migrate-db.js        # Миграции БД
├── .env.example             # Пример конфигурации
├── server.js                # Главный файл
└── package.json             # Зависимости
```

---

## 🔌 API Endpoints

### Публичные

#### Health Check
```bash
GET /health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Контактная форма
```bash
POST /api/contact
Content-Type: application/json

{
  "name": "Иван Иванов",
  "phone": "+7 999 123-45-67",
  "type": "contact_form"
}
```

#### Портфолио
```bash
GET /api/portfolio
```

Ответ:
```json
[
  {
    "id": 1,
    "title": "Проект 1",
    "description": "Описание",
    "image_url": "https://...",
    "project_url": "https://...",
    "tags": ["react", "typescript"],
    "category": "web"
  }
]
```

### Защищенные (требуют токен)

#### Авторизация админа
```bash
POST /api/auth/admin
Content-Type: application/json

{
  "password": "your_password"
}
```

Ответ:
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGc..."
}
```

#### Создание проекта в портфолио
```bash
POST /api/portfolio
X-Admin-Token: your_jwt_token
Content-Type: application/json

{
  "title": "Новый проект",
  "description": "Описание проекта",
  "image_url": "https://...",
  "project_url": "https://...",
  "tags": ["react"],
  "category": "web"
}
```

---

## 🔐 Аутентификация

### Получение токена

1. Авторизуйтесь через `/api/auth/admin`
2. Получите JWT токен
3. Используйте токен в заголовке `X-Admin-Token`

### Пример использования

```javascript
// Получение токена
const response = await fetch('https://api.pixel59.ru/api/auth/admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'your_password' })
});

const { token } = await response.json();

// Использование токена
await fetch('https://api.pixel59.ru/api/portfolio', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Admin-Token': token
  },
  body: JSON.stringify({ title: 'New Project', ... })
});
```

---

## 🗄 База данных

### Подключение

Используется PostgreSQL через библиотеку `pg`.

Конфигурация в `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=pixel_user
DB_PASSWORD=your_password
DB_NAME=pixel_db
```

### Пример запроса

```javascript
const pool = require('./config/database');

const result = await pool.query(
  'SELECT * FROM portfolio WHERE id = $1',
  [projectId]
);

console.log(result.rows);
```

---

## 📦 Зависимости

### Production

- `express` - Web фреймворк
- `pg` - PostgreSQL клиент
- `cors` - CORS middleware
- `dotenv` - Переменные окружения
- `bcrypt` - Хеширование паролей
- `jsonwebtoken` - JWT токены
- `aws-sdk` - S3/MinIO клиент
- `axios` - HTTP клиент
- `helmet` - Security headers
- `compression` - Gzip сжатие
- `express-rate-limit` - Rate limiting

### Development

- `nodemon` - Автоперезагрузка при изменениях

---

## 🔧 Переменные окружения

### Обязательные

```env
PORT=3001
DB_HOST=localhost
DB_USER=pixel_user
DB_PASSWORD=your_strong_password
DB_NAME=pixel_db
JWT_SECRET=your_jwt_secret_32_chars_min
ADMIN_PASSWORD_HASH=$2b$10$your_bcrypt_hash
```

### Опциональные

```env
# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=pixel-files

# Yandex API
YANDEX_METRIKA_TOKEN=your_token
YANDEX_WEBMASTER_TOKEN=your_token

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Bitrix24
BITRIX24_WEBHOOK_URL=https://your-portal.bitrix24.ru/rest/...
```

---

## 🧪 Тестирование

### Ручное тестирование

```bash
# Health check
curl http://localhost:3001/health

# Контактная форма
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"123456","type":"test"}'

# Авторизация
curl -X POST http://localhost:3001/api/auth/admin \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}'
```

---

## 🐛 Отладка

### Просмотр логов

```bash
# При запуске через Docker
docker-compose logs -f api

# При запуске напрямую
# Логи в консоли
```

### Включение debug режима

В `.env`:
```env
NODE_ENV=development
```

В development режиме ошибки возвращаются с полным stack trace.

---

## 🚀 Деплой

### Через Docker (рекомендуется)

```bash
# В корне проекта
docker-compose up -d api
```

### Через PM2

```bash
# Установите PM2
npm install -g pm2

# Запустите сервер
pm2 start server.js --name pixel-api

# Сохраните конфигурацию
pm2 save

# Автозапуск при перезагрузке
pm2 startup
```

### Через systemd

Создайте `/etc/systemd/system/pixel-api.service`:

```ini
[Unit]
Description=Pixel API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/pixel-api
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Запустите:
```bash
systemctl enable pixel-api
systemctl start pixel-api
```

---

## 📊 Мониторинг

### Метрики

API не имеет встроенных метрик. Рекомендуется использовать:
- **Prometheus + Grafana** для мониторинга
- **PM2 Monitoring** для процессов
- **Nginx logs** для HTTP метрик

### Health checks

```bash
# Простая проверка
curl http://localhost:3001/health

# С таймаутом
curl --max-time 5 http://localhost:3001/health
```

---

## 🔒 Безопасность

### Рекомендации

1. **Никогда не коммитьте .env в Git**
2. **Используйте сильные пароли** (16+ символов)
3. **JWT_SECRET** должен быть случайной строкой
4. **CORS** настройте только для своих доменов
5. **Rate limiting** уже включен (100 req/15min)
6. **Helmet** middleware настроен

### Генерация паролей

```bash
# JWT Secret
openssl rand -base64 32

# Admin password hash
node -e "console.log(require('bcrypt').hashSync('your_password', 10))"
```

---

## 🤝 Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker-compose logs api`
2. Проверьте .env файл
3. Проверьте подключение к БД
4. Посмотрите [DEPLOY.md](../DEPLOY.md)

---

## 📝 Changelog

### v1.0.0 (2024-01-01)
- ✅ Базовая структура API
- ✅ Авторизация (JWT)
- ✅ Портфолио CRUD
- ✅ Контактная форма
- ✅ PostgreSQL подключение
- ✅ S3/MinIO интеграция
- ✅ Docker support

---

## 📄 Лицензия

MIT License
