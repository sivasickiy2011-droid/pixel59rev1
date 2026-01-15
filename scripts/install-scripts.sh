#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="/home/deploy/vite_react_shadcn_ts"

echo ""
echo "=============================================="
echo "🔧 УСТАНОВКА СКРИПТОВ"
echo "=============================================="
echo ""

# Проверка прав
if [ "$EUID" -ne 0 ]; then
    echo "❌ Запустите с sudo: sudo $0"
    exit 1
fi

# Делаем скрипты исполняемыми
echo "📝 Установка прав на выполнение..."
chmod +x "$SCRIPT_DIR"/*.sh
echo "✅ Права установлены"

# Создаём символические ссылки
echo ""
echo "🔗 Создание символических ссылок..."

ln -sf "$SCRIPT_DIR/quick-deploy.sh" /usr/local/bin/quick-deploy
ln -sf "$SCRIPT_DIR/deploy-centos9.sh" /usr/local/bin/deploy-centos
ln -sf "$SCRIPT_DIR/verify-deployment.sh" /usr/local/bin/verify-deploy
ln -sf "$SCRIPT_DIR/health-check.sh" /usr/local/bin/health-check
ln -sf "$SCRIPT_DIR/install-yandex-api.sh" /usr/local/bin/install-yandex

echo "✅ Ссылки созданы"

# Проверка
echo ""
echo "=============================================="
echo "✅ УСТАНОВКА ЗАВЕРШЕНА"
echo "=============================================="
echo ""
echo "📋 Доступные команды:"
echo ""
echo "  sudo quick-deploy --full    # Полное развёртывание"
echo "  verify-deploy               # Проверка развёртывания"
echo "  health-check                # Health check"
echo "  sudo deploy-centos          # Базовое развёртывание"
echo "  sudo install-yandex         # Python Gatevey"
echo ""
echo "🚀 Начните с:"
echo "  sudo quick-deploy"
echo ""
