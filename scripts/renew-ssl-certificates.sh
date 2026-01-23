#!/bin/bash

# Скрипт для обновления SSL сертификатов Let's Encrypt
# Запуск: sudo bash scripts/renew-ssl-certificates.sh

set -e

echo "=== Обновление SSL сертификатов Let's Encrypt ==="
echo ""

# Проверка наличия certbot
if ! command -v certbot &> /dev/null; then
    echo "Ошибка: certbot не установлен"
    echo "Установите certbot:"
    echo "  - CentOS/RHEL: sudo yum install certbot python3-certbot-nginx"
    echo "  - Ubuntu/Debian: sudo apt install certbot python3-certbot-nginx"
    exit 1
fi

# Проверка текущих сертификатов
echo "1. Проверка текущих сертификатов:"
certbot certificates
echo ""

# Обновление сертификатов
echo "2. Обновление сертификатов:"
certbot renew --nginx --no-random-sleep-on-renew
echo ""

# Перезагрузка nginx
echo "3. Перезагрузка nginx:"
systemctl reload nginx
echo "Nginx перезагружен"
echo ""

# Проверка статуса nginx
echo "4. Проверка статуса nginx:"
systemctl status nginx --no-pager
echo ""

echo "=== Обновление завершено ==="
echo ""
echo "Для проверки срока действия сертификата можно использовать:"
echo "  echo | openssl s_client -connect pixel59.ru:443 2>/dev/null | openssl x509 -noout -dates"