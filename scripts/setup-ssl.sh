#!/bin/bash
# Настройка SSL сертификатов через Let's Encrypt

if [ -z "$1" ]; then
    echo "❌ Укажите домен"
    echo "Использование: ./setup-ssl.sh pixel59.ru"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@$DOMAIN"

echo "🔒 Настройка SSL для домена: $DOMAIN"

# Создание директорий для certbot
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# Получение сертификата
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN \
  -d api.$DOMAIN \
  -d cdn.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL сертификаты успешно получены"
    echo "🔄 Перезапуск Nginx..."
    docker-compose restart nginx
    echo "✅ Готово! Ваш сайт доступен по HTTPS"
else
    echo "❌ Ошибка при получении SSL сертификатов"
    echo "Проверьте DNS записи для домена и поддоменов"
    exit 1
fi
