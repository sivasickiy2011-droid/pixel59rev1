# 📦 Полная инструкция по переносу сайта centerai.tech

## 🎯 Краткое резюме

**Статус:** Все 24 backend функции используются — переносим всё!

**Компоненты для переноса:**
- ✅ 24 backend функции (Python)
- ✅ База данных PostgreSQL (10 таблиц, ~200 записей)
- ✅ S3 хранилище с изображениями
- ✅ 19 секретов (API ключи, пароли)
- ✅ Frontend (React SPA)

---

## 📋 Полный список backend функций

| № | Функция | Назначение | Критичность | Используется в |
|---|---------|------------|-------------|----------------|
| 1 | **track-visit** | Аналитика посещений | 🔴 | analytics.ts |
| 2 | **get-analytics** | Статистика аналитики | 🔴 | OwnStatsTab.tsx |
| 3 | **seo-analyze** | AI-анализ SEO | 🟡 | SeoTab.tsx |
| 4 | **seo-apply** | Применение SEO | 🟡 | SeoTab.tsx |
| 5 | **bot-logger** | Логирование ботов | 🟡 | BotProtection.tsx |
| 6 | **bot-stats** | Статистика ботов | 🟢 | BotAdmin.tsx |
| 7 | **password-manager** | Управление паролями | 🔴 | ChangePassword.tsx |
| 8 | **upload-image** | Загрузка в S3 | 🔴 | PortfolioImageUploader.tsx, LogoAdmin.tsx |
| 9 | **brief-handler** | Обработка брифов | 🟡 | Brief.tsx |
| 10 | **secure-settings** | Настройки в БД | 🔴 | useSecureSettings.ts |
| 11 | **contact-form** | Форма связи → Bitrix24 + Telegram | 🔴 | ContactModal.tsx |
| 12 | **services-admin** | Управление услугами | 🟡 | ServicesAdmin.tsx |
| 13 | **yandex-metrika-stats** | Яндекс.Метрика API | 🟢 | Analytics.tsx |
| 14 | **yandex-webmaster-issues** | Яндекс.Вебмастер | 🟢 | Analytics.tsx |
| 15 | **portfolio** | CRUD портфолио | 🔴 | PortfolioAdmin.tsx |
| 16 | **admin-partner-logos** | Логотипы партнеров | 🟡 | PartnersAdmin.tsx |
| 17 | **partners** | CRUD партнеров | 🟡 | Partners.tsx, PartnersCarousel.tsx |
| 18 | **partner-auth** | Авторизация партнеров | 🟡 | PartnerContext.tsx |
| 19 | **submit-order** | Заказы → Bitrix24 + Telegram | 🔴 | OrderModal.tsx |
| 20 | **admin-login-logs** | Логи входов | 🟡 | LoginHistory.tsx |
| 21 | **auth-admin** | Авторизация админов | 🔴 | AdminLogin.tsx |
| 22 | **consent** | Согласия GDPR | 🟡 | ConsentAdmin.tsx, CookieConsent.tsx |
| 23 | **news-feed** | Новости | 🟢 | News.tsx |

**Итого:** 24 функции, все используются ✅

---

## 🗄️ База данных PostgreSQL

### Таблицы (10 штук):

1. **admin_login_logs** — 70 записей
   - Логи входов администраторов
   - Используют: `admin-login-logs`, `auth-admin`

2. **bot_logs** — 46 записей
   - Логи доступа ботов
   - Используют: `bot-logger`, `bot-stats`

3. **daily_stats** — 1 запись
   - Агрегированная статистика
   - Используют: `get-analytics`

4. **partner_logos** — 5 записей
   - Логотипы партнеров
   - Используют: `admin-partner-logos`

5. **partners** — 1 запись
   - Данные партнеров
   - Используют: `partners`, `partner-auth`

6. **portfolio_projects** — 11 записей
   - Проекты портфолио
   - Используют: `portfolio`

7. **secure_settings** — 8 записей
   - Зашифрованные настройки
   - Используют: `secure-settings`

8. **services** — 17 записей
   - Каталог услуг
   - Используют: `services-admin`

9. **site_visits** — 25 записей
   - Посещения сайта
   - Используют: `track-visit`, `get-analytics`

10. **user_consents** — 12 записей
    - Согласия пользователей
    - Используют: `consent`

---

## 🔐 Секреты (19 штук)

### Обязательные:

1. **DATABASE_URL** 🔴
   - PostgreSQL connection string
   - Формат: `postgresql://user:pass@host:port/database`

2. **AWS_ACCESS_KEY_ID** 🔴
   - Ключ S3 хранилища

3. **AWS_SECRET_ACCESS_KEY** 🔴
   - Секретный ключ S3

4. **S3_BUCKET_NAME** 🔴
   - Имя бакета (сейчас: `files`)

5. **S3_ENDPOINT_URL** 🔴
   - URL S3 (сейчас: `https://bucket.poehali.dev`)

6. **S3_REGION** 🔴
   - Регион S3 (например: `ru-central1`)

7. **ADMIN_PASSWORD_HASH** 🔴
   - Bcrypt хеш пароля админа

8. **ENCRYPTION_KEY** 🔴
   - Ключ шифрования для `secure_settings`
   - Генерация: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

### Интеграции (опционально):

9. **BITRIX24_WEBHOOK_URL** 🟡
   - Webhook Bitrix24 CRM

10. **TELEGRAM_BOT_TOKEN** 🟡
    - Токен Telegram бота

11. **TELEGRAM_CHAT_ID** 🟡
    - ID чата для уведомлений

12. **OPENAI_API_KEY** 🟡
    - API ключ OpenAI (для SEO анализа)

13. **OPENAI_API_BASE** 🟡
    - Альтернативный endpoint OpenAI

14-19. **SMTP_*, YANDEX_*** 🟢
    - Email и Яндекс сервисы (низкий приоритет)

---

## 📝 Пошаговая инструкция

### Шаг 1: Подготовка сервера

#### Требования:
- Ubuntu 20.04+ / CentOS 7+ / Debian 11+
- RAM: минимум 2GB, рекомендуется 4GB
- Disk: минимум 20GB SSD
- Python 3.11+
- PostgreSQL 13+
- Nginx 1.18+

#### Установка:
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Nginx
sudo apt install nginx -y

# Certbot для SSL
sudo apt install certbot python3-certbot-nginx -y
```

---

### Шаг 2: Перенос базы данных

#### Экспорт данных из poehali.dev:
```bash
# Дамп базы данных
pg_dump "postgresql://user:pass@host:port/db" > database_backup.sql
```

#### Создание базы на новом сервере:
```bash
# Войти в PostgreSQL
sudo -u postgres psql

# Создать пользователя и базу
CREATE USER centerai_user WITH PASSWORD 'strong_password_here';
CREATE DATABASE centerai_db OWNER centerai_user;
GRANT ALL PRIVILEGES ON DATABASE centerai_db TO centerai_user;
\q

# Импортировать дамп
psql -U centerai_user -d centerai_db < database_backup.sql
```

#### Проверка:
```sql
psql -U centerai_user -d centerai_db

\dt  -- показать таблицы

-- Проверить количество записей
SELECT 'admin_login_logs' as table, count(*) FROM admin_login_logs UNION ALL
SELECT 'bot_logs', count(*) FROM bot_logs UNION ALL
SELECT 'daily_stats', count(*) FROM daily_stats UNION ALL
SELECT 'partner_logos', count(*) FROM partner_logos UNION ALL
SELECT 'partners', count(*) FROM partners UNION ALL
SELECT 'portfolio_projects', count(*) FROM portfolio_projects UNION ALL
SELECT 'secure_settings', count(*) FROM secure_settings UNION ALL
SELECT 'services', count(*) FROM services UNION ALL
SELECT 'site_visits', count(*) FROM site_visits UNION ALL
SELECT 'user_consents', count(*) FROM user_consents;
```

---

### Шаг 3: Настройка S3 хранилища

#### Вариант A: Yandex Object Storage
```bash
# 1. Создать бакет в Яндекс.Облако
# 2. Получить access_key и secret_key
# 3. Настроить публичный доступ

# 4. Скопировать файлы
aws s3 sync s3://old-bucket s3://new-bucket --region ru-central1
```

#### Вариант B: Self-hosted MinIO
```bash
# Установить MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Запустить
export MINIO_ROOT_USER=admin
export MINIO_ROOT_PASSWORD=your_password
minio server /data --console-address ":9001"
```

---

### Шаг 4: Деплой backend функций

#### Структура:
```
/var/www/backend/
├── track-visit/
│   ├── index.py
│   ├── requirements.txt
│   ├── wsgi.py
│   └── .env
├── get-analytics/
│   └── ...
├── ... (все 24 функции)
```

#### Создание WSGI wrapper для каждой функции:
```python
# /var/www/backend/track-visit/wsgi.py
import json
import os
from index import handler

def application(environ, start_response):
    method = environ.get('REQUEST_METHOD', 'GET')
    path = environ.get('PATH_INFO', '/')
    query_string = environ.get('QUERY_STRING', '')
    
    try:
        request_body_size = int(environ.get('CONTENT_LENGTH', 0))
    except ValueError:
        request_body_size = 0
    
    request_body = environ['wsgi.input'].read(request_body_size).decode('utf-8')
    
    event = {
        'httpMethod': method,
        'path': path,
        'queryStringParameters': dict(x.split('=') for x in query_string.split('&') if x),
        'headers': {k[5:].replace('_', '-').lower(): v 
                   for k, v in environ.items() if k.startswith('HTTP_')},
        'body': request_body,
        'isBase64Encoded': False
    }
    
    class Context:
        request_id = 'local-' + os.urandom(8).hex()
        function_name = 'track-visit'
        function_version = '1.0'
        memory_limit_in_mb = 256
    
    response = handler(event, Context())
    
    status = str(response.get('statusCode', 200)) + ' OK'
    headers = [(k, v) for k, v in response.get('headers', {}).items()]
    
    start_response(status, headers)
    return [response.get('body', '').encode('utf-8')]
```

#### Systemd service для функции:
```ini
# /etc/systemd/system/backend-track-visit.service
[Unit]
Description=Backend: track-visit
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/backend/track-visit
Environment="PATH=/var/www/backend/track-visit/venv/bin"
EnvironmentFile=/var/www/backend/track-visit/.env
ExecStart=/var/www/backend/track-visit/venv/bin/gunicorn --workers 2 --bind 127.0.0.1:8001 wsgi:application

[Install]
WantedBy=multi-user.target
```

#### Автоматизация деплоя всех 24 функций:
```bash
#!/bin/bash
# deploy_all_functions.sh

FUNCTIONS=(
  "track-visit:8001"
  "get-analytics:8002"
  "seo-analyze:8003"
  "seo-apply:8004"
  "bot-logger:8005"
  "bot-stats:8006"
  "password-manager:8007"
  "upload-image:8008"
  "brief-handler:8009"
  "secure-settings:8010"
  "contact-form:8011"
  "services-admin:8012"
  "yandex-metrika-stats:8013"
  "yandex-webmaster-issues:8014"
  "portfolio:8015"
  "admin-partner-logos:8016"
  "partners:8017"
  "partner-auth:8018"
  "submit-order:8019"
  "admin-login-logs:8020"
  "auth-admin:8021"
  "consent:8022"
  "news-feed:8023"
)

for func_port in "${FUNCTIONS[@]}"; do
  IFS=':' read -r func port <<< "$func_port"
  
  echo "=== Deploying $func on port $port ==="
  
  cd /var/www/backend/$func
  
  # Создать venv
  python3.11 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt gunicorn
  deactivate
  
  # Создать systemd service
  cat > /etc/systemd/system/backend-$func.service <<EOF
[Unit]
Description=Backend: $func
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/backend/$func
Environment="PATH=/var/www/backend/$func/venv/bin"
EnvironmentFile=/var/www/backend/$func/.env
ExecStart=/var/www/backend/$func/venv/bin/gunicorn --workers 2 --bind 127.0.0.1:$port wsgi:application

[Install]
WantedBy=multi-user.target
EOF

  # Запустить
  systemctl daemon-reload
  systemctl enable backend-$func
  systemctl start backend-$func
  
  echo "✅ $func deployed on port $port"
done

echo ""
echo "✅ All 24 functions deployed successfully!"
```

---

### Шаг 5: Настройка Nginx

```nginx
# /etc/nginx/sites-available/centerai.tech

# Upstream для всех 24 функций
upstream backend_track_visit { server 127.0.0.1:8001; }
upstream backend_get_analytics { server 127.0.0.1:8002; }
upstream backend_seo_analyze { server 127.0.0.1:8003; }
upstream backend_seo_apply { server 127.0.0.1:8004; }
upstream backend_bot_logger { server 127.0.0.1:8005; }
upstream backend_bot_stats { server 127.0.0.1:8006; }
upstream backend_password_manager { server 127.0.0.1:8007; }
upstream backend_upload_image { server 127.0.0.1:8008; }
upstream backend_brief_handler { server 127.0.0.1:8009; }
upstream backend_secure_settings { server 127.0.0.1:8010; }
upstream backend_contact_form { server 127.0.0.1:8011; }
upstream backend_services_admin { server 127.0.0.1:8012; }
upstream backend_yandex_metrika { server 127.0.0.1:8013; }
upstream backend_yandex_webmaster { server 127.0.0.1:8014; }
upstream backend_portfolio { server 127.0.0.1:8015; }
upstream backend_partner_logos { server 127.0.0.1:8016; }
upstream backend_partners { server 127.0.0.1:8017; }
upstream backend_partner_auth { server 127.0.0.1:8018; }
upstream backend_submit_order { server 127.0.0.1:8019; }
upstream backend_admin_logs { server 127.0.0.1:8020; }
upstream backend_auth_admin { server 127.0.0.1:8021; }
upstream backend_consent { server 127.0.0.1:8022; }
upstream backend_news_feed { server 127.0.0.1:8023; }

server {
    listen 80;
    server_name centerai.tech www.centerai.tech;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name centerai.tech www.centerai.tech;
    
    # SSL (Let's Encrypt заполнит автоматически)
    ssl_certificate /etc/letsencrypt/live/centerai.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/centerai.tech/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Frontend
    root /var/www/frontend/dist;
    index index.html;
    
    # API routes
    location /api/track-visit { proxy_pass http://backend_track_visit; }
    location /api/get-analytics { proxy_pass http://backend_get_analytics; }
    location /api/seo-analyze { proxy_pass http://backend_seo_analyze; }
    location /api/seo-apply { proxy_pass http://backend_seo_apply; }
    location /api/bot-logger { proxy_pass http://backend_bot_logger; }
    location /api/bot-stats { proxy_pass http://backend_bot_stats; }
    location /api/password-manager { proxy_pass http://backend_password_manager; }
    location /api/upload-image { 
        proxy_pass http://backend_upload_image;
        client_max_body_size 10M;
    }
    location /api/brief-handler { proxy_pass http://backend_brief_handler; }
    location /api/secure-settings { proxy_pass http://backend_secure_settings; }
    location /api/contact-form { proxy_pass http://backend_contact_form; }
    location /api/services-admin { proxy_pass http://backend_services_admin; }
    location /api/yandex-metrika-stats { proxy_pass http://backend_yandex_metrika; }
    location /api/yandex-webmaster-issues { proxy_pass http://backend_yandex_webmaster; }
    location /api/portfolio { proxy_pass http://backend_portfolio; }
    location /api/admin-partner-logos { proxy_pass http://backend_partner_logos; }
    location /api/partners { proxy_pass http://backend_partners; }
    location /api/partner-auth { proxy_pass http://backend_partner_auth; }
    location /api/submit-order { proxy_pass http://backend_submit_order; }
    location /api/admin-login-logs { proxy_pass http://backend_admin_logs; }
    location /api/auth-admin { proxy_pass http://backend_auth_admin; }
    location /api/consent { proxy_pass http://backend_consent; }
    location /api/news-feed { proxy_pass http://backend_news_feed; }
    
    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Активация
sudo ln -s /etc/nginx/sites-available/centerai.tech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Шаг 6: Настройка переменных окружения

#### Создать `.env` для каждой функции:
```bash
# /var/www/backend/track-visit/.env
DATABASE_URL=postgresql://centerai_user:password@localhost:5432/centerai_db
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=files
S3_ENDPOINT_URL=https://storage.yandexcloud.net
S3_REGION=ru-central1
ADMIN_PASSWORD_HASH=$2b$12$...
ENCRYPTION_KEY=your_encryption_key_base64
BITRIX24_WEBHOOK_URL=https://your-domain.bitrix24.ru/rest/1/webhook/
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
OPENAI_API_KEY=your_openai_key
OPENAI_API_BASE=https://api.openai.com/v1
```

#### Скрипт копирования .env:
```bash
#!/bin/bash
# copy_env_to_all.sh

ENV_TEMPLATE="/var/www/backend/.env.template"

for dir in /var/www/backend/*/; do
  if [ -f "$dir/index.py" ]; then
    cp "$ENV_TEMPLATE" "$dir/.env"
    chmod 600 "$dir/.env"
    chown www-data:www-data "$dir/.env"
    echo "✅ Copied .env to $dir"
  fi
done
```

---

### Шаг 7: Деплой frontend

#### Обновление URL в коде:
```typescript
// src/config/api.ts
export const API_BASE_URL = 'https://centerai.tech/api';

export const API_ENDPOINTS = {
  trackVisit: `${API_BASE_URL}/track-visit`,
  getAnalytics: `${API_BASE_URL}/get-analytics`,
  seoAnalyze: `${API_BASE_URL}/seo-analyze`,
  // ... остальные 21 функция
};
```

#### Сборка и деплой:
```bash
# Локально
npm install
npm run build

# Копирование на сервер
scp -r dist/* user@server:/var/www/frontend/dist/
```

---

### Шаг 8: SSL сертификаты

```bash
# Получить SSL от Let's Encrypt
sudo certbot --nginx -d centerai.tech -d www.centerai.tech

# Автоматическое продление
sudo crontab -e
# Добавить:
0 3 * * * /usr/bin/certbot renew --quiet
```

---

### Шаг 9: Backup

#### Backup базы данных:
```bash
#!/bin/bash
# /usr/local/bin/backup_db.sh

BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR
pg_dump -U centerai_user centerai_db | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Crontab (каждый день в 2:00)
0 2 * * * /usr/local/bin/backup_db.sh
```

---

## ✅ Проверка после переноса

### Чеклист:

- [ ] Frontend открывается по домену
- [ ] SSL активен (зеленый замок)
- [ ] Все 24 backend функции отвечают
- [ ] База данных содержит все данные
- [ ] S3 файлы загружаются
- [ ] Форма обратной связи работает
- [ ] Форма заказа работает
- [ ] Калькулятор работает
- [ ] Админка работает
- [ ] Портфолио отображается
- [ ] Аналитика собирается
- [ ] Bitrix24 получает заявки
- [ ] Telegram уведомления приходят

### Тестовые запросы:

```bash
# 1. Track visit
curl -X POST https://centerai.tech/api/track-visit \
  -H "Content-Type: application/json" \
  -d '{"page":"/","referrer":"","userAgent":"test"}'

# 2. Contact form
curl -X POST https://centerai.tech/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"+79001234567","type":"contact_form"}'

# 3. Auth admin
curl -X POST https://centerai.tech/api/auth-admin \
  -H "Content-Type: application/json" \
  -d '{"password":"admin_password"}'
```

---

## 📊 Требования к ресурсам

### Минимальные:
- CPU: 2 cores
- RAM: 4GB
- Disk: 40GB SSD
- Bandwidth: 1TB/мес

### Рекомендуемые:
- CPU: 4 cores
- RAM: 8GB
- Disk: 100GB SSD
- Bandwidth: 2TB/мес

### Стоимость хостинга:
- VPS (Hetzner): ~€5-10/мес
- VPS (DigitalOcean): $12-24/мес
- VPS (Яндекс.Облако): ₽1000-2000/мес

---

## 🚨 Важно

### Безопасность:
- ✅ Только HTTPS
- ✅ Firewall (ufw/iptables)
- ✅ PostgreSQL только localhost
- ✅ Сильные пароли
- ✅ Регулярные обновления

### Мониторинг:
```bash
# Логи Nginx
sudo tail -f /var/log/nginx/error.log

# Логи backend
sudo journalctl -u backend-contact-form -f

# Логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# Проверка статуса
sudo systemctl status backend-track-visit
```

---

## 🎓 Полезные ссылки

- [Nginx docs](https://nginx.org/ru/docs/)
- [PostgreSQL docs](https://postgrespro.ru/docs/postgresql)
- [Gunicorn deployment](https://docs.gunicorn.org/en/stable/deploy.html)
- [Let's Encrypt certbot](https://certbot.eff.org/)

---

**Итого: 24 функции переносим все, время: ~4-8 часов**

Готово к переносу! 🚀
