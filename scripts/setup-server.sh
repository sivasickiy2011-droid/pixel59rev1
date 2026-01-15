#!/bin/bash
# Автоматическая настройка сервера для Pixel проекта

set -e

echo "🚀 Начинаю настройку сервера для Pixel..."

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустите скрипт с правами root (sudo ./setup-server.sh)"
    exit 1
fi

echo "📦 Обновление системы..."
apt update && apt upgrade -y

echo "📦 Установка необходимых пакетов..."
apt install -y curl wget git nano ufw

# Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    echo "📦 Установка Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker уже установлен"
fi

# Firewall
echo "🔥 Настройка firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status

echo ""
echo "✅ Базовая настройка сервера завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Склонируйте проект: git clone <your-repo-url>"
echo "2. Перейдите в директорию: cd pixel-project"
echo "3. Скопируйте .env.example в .env: cp server/.env.example server/.env"
echo "4. Отредактируйте server/.env и укажите пароли и ключи"
echo "5. Импортируйте базу данных: ./scripts/import-database.sh <dump-file>"
echo "6. Запустите проект: docker-compose up -d"
echo "7. Настройте SSL: ./scripts/setup-ssl.sh pixel59.ru"
echo ""
