#!/bin/bash
# Автоматическая настройка CentOS сервера для Pixel проекта

set -e

echo "🚀 Начинаю настройку CentOS сервера для Pixel..."

# Проверка прав root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустите скрипт с правами root (sudo ./setup-server-centos.sh)"
    exit 1
fi

echo "📦 Обновление системы..."
yum update -y

echo "📦 Установка необходимых пакетов..."
yum install -y curl wget git nano yum-utils

# Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Установка Docker..."
    yum install -y yum-utils
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    systemctl start docker
    systemctl enable docker
else
    echo "✅ Docker уже установлен"
fi

# Docker Compose (standalone)
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Установка Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose уже установлен"
fi

# Firewall
echo "🔥 Настройка firewall..."
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
firewall-cmd --list-all

echo ""
echo "✅ Базовая настройка CentOS сервера завершена!"
echo ""
echo "🐳 Проверка Docker:"
docker --version
docker-compose --version
echo ""
echo "📋 Следующие шаги:"
echo "1. Создайте директорию проекта: mkdir -p /opt/pixel && cd /opt/pixel"
echo "2. Скопируйте файлы проекта на сервер (через scp или git)"
echo "3. Скопируйте .env: cp server/.env.example server/.env"
echo "4. Отредактируйте server/.env и укажите пароли"
echo "5. Запустите проект: docker-compose up -d"
echo ""
