# Деплой на CentOS (локальное тестирование)

Пошаговая инструкция для развертывания проекта на CentOS сервере без настройки DNS.

## Шаг 1: Установка Docker на сервере

Подключитесь к серверу по SSH:
```bash
ssh user@your-server-ip
```

Скопируйте скрипт установки и запустите:
```bash
# Создайте файл
nano setup-server-centos.sh

# Скопируйте содержимое из scripts/setup-server-centos.sh

# Дайте права на выполнение
chmod +x setup-server-centos.sh

# Запустите с правами root
sudo ./setup-server-centos.sh
```

Или выполните команды вручную:
```bash
# Обновление системы
sudo yum update -y

# Установка Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Запуск Docker
sudo systemctl start docker
sudo systemctl enable docker

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка
docker --version
docker-compose --version
```

## Шаг 2: Копирование проекта на сервер

### Вариант А: Через GitHub (рекомендуется)
```bash
# На сервере
cd /opt
sudo mkdir pixel
sudo chown $USER:$USER pixel
cd pixel

# Клонируйте репозиторий
git clone https://github.com/your-username/pixel-project.git .
```

### Вариант Б: Через SCP (с локального компьютера)
```bash
# На вашем локальном компьютере (не на сервере!)
# Упакуйте проект
tar -czf pixel-project.tar.gz \
  docker-compose.yml \
  nginx.conf \
  server/ \
  dist/ \
  scripts/

# Скопируйте на сервер
scp pixel-project.tar.gz user@your-server-ip:/opt/

# На сервере распакуйте
ssh user@your-server-ip
cd /opt
tar -xzf pixel-project.tar.gz
```

## Шаг 3: Экспорт базы данных с poehali.dev

### На локальном компьютере:
```bash
# Используйте готовый скрипт
./scripts/export-database.sh

# Или вручную через psql
pg_dump -h <db-host> -U <db-user> -d <db-name> > pixel_db_dump.sql
```

### Скопируйте дамп на сервер:
```bash
scp pixel_db_dump.sql user@your-server-ip:/opt/pixel/
```

## Шаг 4: Настройка окружения

На сервере:
```bash
cd /opt/pixel

# Скопируйте пример конфигурации
cp server/.env.example server/.env

# Отредактируйте .env
nano server/.env
```

Минимальная конфигурация для локального теста:
```env
# Server
PORT=3001
NODE_ENV=production

# Database (используйте эти значения - они совпадают с docker-compose.yml)
DB_HOST=postgres
DB_PORT=5432
DB_USER=pixel_user
DB_PASSWORD=ВАШ_СИЛЬНЫЙ_ПАРОЛЬ
DB_NAME=pixel_db

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=ваш_случайный_секрет_минимум_32_символа

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin_password_change_me
S3_BUCKET=pixel-files
S3_PUBLIC_URL=http://ВАШ_SERVER_IP:9000

# CORS (для локального теста)
CORS_ORIGINS=http://ВАШ_SERVER_IP,http://localhost:3000
```

Сгенерируйте JWT_SECRET:
```bash
openssl rand -base64 32
```

## Шаг 5: Запуск Docker Compose

```bash
cd /opt/pixel

# Запустите все сервисы
docker-compose up -d

# Проверьте статус
docker-compose ps

# Должны быть запущены:
# - postgres (база данных)
# - minio (хранилище файлов)
# - api (ваш API сервер)
# - nginx (веб-сервер)
```

## Шаг 6: Импорт базы данных

```bash
cd /opt/pixel

# Используйте готовый скрипт
./scripts/import-database.sh pixel_db_dump.sql

# Или вручную
docker-compose exec -T postgres psql -U pixel_user -d pixel_db < pixel_db_dump.sql
```

## Шаг 7: Настройка hosts для локального доступа

### На вашем локальном компьютере (Windows):
```
# Откройте файл: C:\Windows\System32\drivers\etc\hosts
# Добавьте строки:

ВАШ_SERVER_IP pixel59.ru
ВАШ_SERVER_IP www.pixel59.ru
ВАШ_SERVER_IP api.pixel59.ru
ВАШ_SERVER_IP cdn.pixel59.ru
```

### На Linux/Mac:
```bash
sudo nano /etc/hosts

# Добавьте:
ВАШ_SERVER_IP pixel59.ru
ВАШ_SERVER_IP www.pixel59.ru
ВАШ_SERVER_IP api.pixel59.ru
ВАШ_SERVER_IP cdn.pixel59.ru
```

## Шаг 8: Проверка работы

Откройте браузер и проверьте:

1. **Основной сайт**: http://pixel59.ru
2. **API**: http://api.pixel59.ru/api/portfolio
3. **MinIO консоль**: http://cdn.pixel59.ru:9001 (логин: minioadmin / пароль из .env)

## Полезные команды

```bash
# Просмотр логов
docker-compose logs -f api
docker-compose logs -f nginx
docker-compose logs -f postgres

# Перезапуск сервисов
docker-compose restart api
docker-compose restart nginx

# Остановка всех сервисов
docker-compose down

# Полная пересборка
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Подключение к базе данных
docker-compose exec postgres psql -U pixel_user -d pixel_db

# Очистка и полный перезапуск
docker-compose down -v  # ОСТОРОЖНО: удалит все данные!
docker-compose up -d
```

## Решение проблем

### API не отвечает
```bash
# Проверьте логи
docker-compose logs api

# Проверьте, что контейнер запущен
docker-compose ps

# Перезапустите
docker-compose restart api
```

### Nginx показывает 502 Bad Gateway
```bash
# Проверьте, что API запущен
docker-compose ps api

# Проверьте логи nginx
docker-compose logs nginx

# Проверьте настройки
docker-compose exec nginx nginx -t
```

### База данных не подключается
```bash
# Проверьте логи PostgreSQL
docker-compose logs postgres

# Проверьте подключение
docker-compose exec postgres psql -U pixel_user -d pixel_db -c "SELECT version();"
```

### Не работают изображения
```bash
# Проверьте MinIO
docker-compose logs minio

# Откройте MinIO консоль
http://ВАШ_SERVER_IP:9001

# Создайте bucket если нужно
# Логин: minioadmin
# Пароль: из S3_SECRET_KEY в .env
```

## Следующие шаги

После успешного локального тестирования:

1. **Настройте реальные DNS записи** для pixel59.ru
2. **Установите SSL сертификаты**: `./scripts/setup-ssl.sh`
3. **Обновите CORS_ORIGINS** в .env на production домены
4. **Настройте автоматические бэкапы** базы данных

## Безопасность

⚠️ Для production обязательно:

1. Измените все пароли в .env
2. Смените MinIO credentials (S3_ACCESS_KEY, S3_SECRET_KEY)
3. Настройте firewall (только порты 22, 80, 443)
4. Включите SSL сертификаты
5. Настройте регулярные бэкапы
