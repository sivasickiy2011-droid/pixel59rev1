#!/bin/bash
# =============================================================================
# 🏥 СКРИПТ HEALTH CHECK ДЛЯ PROJECTA
# =============================================================================
# Использование: (можно добавить в cron)
#   ./health-check.sh
#   ./health-check.sh --notify  # с уведомлениями в Telegram
# =============================================================================

set -e

# Конфигурация
PROJECT_DIR="/home/deploy/vite_react_shadcn_ts"
API_URL="http://localhost:3001"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID}"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Статус
STATUS="OK"
MESSAGES=()

# Функции
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; STATUS="ERROR"; MESSAGES+=("ERROR: $1"); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Отправка уведомления в Telegram
send_telegram() {
    local message="$1"
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=$message" \
            -d "parse_mode=HTML" > /dev/null 2>&1
    fi
}

echo ""
echo "=============================================="
echo "🏥 HEALTH CHECK PROJECTA"
echo "=============================================="
log "Начало проверки..."

cd "$PROJECT_DIR"

# =============================================================================
# 1. ПРОВЕРКА DOCKER DAEMON
# =============================================================================
echo ""
echo "1. Docker Daemon:"
if docker info &> /dev/null; then
    ok "Docker запущен"
else
    error "Docker не отвечает"
fi

# =============================================================================
# 2. ПРОВЕРКА КОНТЕЙНЕРОВ
# =============================================================================
echo ""
echo "2. Контейнеры:"

CONTAINERS_RUNNING=$(docker-compose ps --format json 2>/dev/null | grep -c '"State":"running"' || echo "0")
TOTAL_CONTAINERS=$(docker-compose ps -q 2>/dev/null | wc -l)

if [ "$CONTAINERS_RUNNING" -eq "$TOTAL_CONTAINERS" ]; then
    ok "Все контейнеры запущены ($CONTAINERS_RUNNING/$TOTAL_CONTAINERS)"
else
    error "Не все контейнеры запущены ($CONTAINERS_RUNNING/$TOTAL_CONTAINERS)"
    docker-compose ps | grep -E "(Exit|Restarting)" || true
fi

# =============================================================================
# 3. ПРОВЕРКА POSTGRESQL
# =============================================================================
echo ""
echo "3. PostgreSQL:"

if docker-compose exec -T postgres pg_isready -U pixel_user &> /dev/null; then
    ok "PostgreSQL готов"
    
    # Проверка соединения
    if docker-compose exec -T postgres psql -U pixel_user -d pixel_db -c "SELECT 1" &> /dev/null; then
        ok "Подключение к БД успешно"
    else
        error "Не удалось подключиться к БД"
    fi
else
    error "PostgreSQL не готов"
fi

# =============================================================================
# 4. ПРОВЕРКА MINIO
# =============================================================================
echo ""
echo "4. MinIO:"

if curl -s "http://localhost:9000/minio/health/live" | grep -q "OK" 2>/dev/null; then
    ok "MinIO жив"
else
    error "MinIO не отвечает"
fi

# =============================================================================
# 5. ПРОВЕРКА API
# =============================================================================
echo ""
echo "5. API Backend:"

HEALTH=$(curl -s "$API_URL/health" 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q "ok"; then
    ok "API health check OK"
    echo "    Response: $HEALTH"
else
    error "API health check failed"
    log "Response: $HEALTH"
fi

# =============================================================================
# 6. ПРОВЕРКА NGINX
# =============================================================================
echo ""
echo "6. Nginx:"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "Nginx отвечает (код: $HTTP_CODE)"
elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    warn "Nginx редирект (код: $HTTP_CODE) - ожидается без SSL"
else
    error "Nginx не отвечает (код: $HTTP_CODE)"
fi

# =============================================================================
# 7. ПРОВЕРКА ДИСКА
# =============================================================================
echo ""
echo "7. Диск:"

DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 90 ]; then
    ok "Диск: использовано $DISK_USAGE%"
else
    error "Диск критически заполнен: $DISK_USAGE%"
fi

# =============================================================================
# 8. ПРОВЕРКА ПАМЯТИ
# =============================================================================
echo ""
echo "8. Память:"

MEM_USAGE=$(free | tail -1 | awk '{print $3/$2 * 100}' | cut -d. -f1)
if [ "$MEM_USAGE" -lt 90 ]; then
    ok "Память: использовано $MEM_USAGE%"
else
    warn "Память: использовано $MEM_USAGE%"
fi

# =============================================================================
# ИТОГ
# =============================================================================
echo ""
echo "=============================================="

if [ "$STATUS" = "OK" ]; then
    echo -e "${GREEN}🎉 HEALTH CHECK: OK${NC}"
    log "Все сервисы работают"
    
    if [ "$1" = "--notify" ]; then
        send_telegram "✅ <b>Pixel Project Health Check</b>\n\nВсе сервисы работают нормально.\n🕐 $(date)"
    fi
    exit 0
else
    echo -e "${RED}🚨 HEALTH CHECK: ERROR${NC}"
    log "Есть проблемы, требуется внимание"
    
    if [ "$1" = "--notify" ]; then
        MESSAGE="🚨 <b>Pixel Project ALERT</b>\n\nПроблемы обнаружены:\n"
        for msg in "${MESSAGES[@]}"; do
            MESSAGE="$MESSAGE• $msg\n"
        done
        MESSAGE="$MESSAGE\n🕐 $(date)"
        send_telegram "$MESSAGE"
    fi
    exit 1
fi
"