#!/bin/bash
# =============================================================================
# ✅ СКРИПТ ПРОВЕРКИ РАЗВЁРТЫВАНИЯ PROJECTA
# =============================================================================
# Использование:
#   ./verify-deployment.sh
#
# Проверяет:
#   - Docker и контейнеры
#   - Базу данных PostgreSQL
#   - MinIO хранилище
#   - API backend
#   - Nginx
#   - SSL сертификаты
# =============================================================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Конфигурация
PROJECT_DIR="/home/deploy/vite_react_shadcn_ts"
API_URL="http://localhost:3001"
NGINX_URL="http://localhost"
MINIO_CONSOLE="http://localhost:9001"

# Счётчики
PASSED=0
FAILED=0
WARNINGS=0

# Функции
pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; ((PASSED++)); }
fail() { echo -e "${RED}❌ FAIL${NC}: $1"; ((FAILED++)); }
warn() { echo -e "${YELLOW}⚠️  WARN${NC}: $1"; ((WARNINGS++)); }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
section() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN} $1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

echo ""
echo "=============================================="
echo "✅ ПРОВЕРКА РАЗВЁРТЫВАНИЯ PROJECTA"
echo "=============================================="
echo ""

# =============================================================================
# 1. ПРОВЕРКА DOCKER
# =============================================================================
section "1. DOCKER"

if command -v docker &> /dev/null; then
    pass "Docker установлен: $(docker --version)"
else
    fail "Docker не установлен"
fi

if docker info &> /dev/null; then
    pass "Docker daemon запущен"
else
    fail "Docker daemon не запущен (sudo systemctl start docker)"
fi

if command -v docker-compose &> /dev/null; then
    pass "Docker Compose установлен: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    pass "Docker Compose (plugin) установлен"
else
    fail "Docker Compose не установлен"
fi

# =============================================================================
# 2. ПРОВЕРКА КОНТЕЙНЕРОВ
# =============================================================================
section "2. КОНТЕЙНЕРЫ"

cd "$PROJECT_DIR"

# Получаем список контейнеров
CONTAINERS=$(docker-compose ps -q 2>/dev/null | wc -l)
if [ "$CONTAINERS" -gt 0 ]; then
    pass "Запущено контейнеров: $CONTAINERS"
else
    warn "Контейнеры не запущены или проект не развёрнут"
fi

# Проверяем каждый контейнер
declare -a SERVICES=("postgres" "minio" "api" "nginx" "certbot")
for service in "${SERVICES[@]}"; do
    if docker-compose ps | grep -q "$service"; then
        STATUS=$(docker-compose ps | grep "$service" | awk '{print $3}')
        if [ "$STATUS" = "Up" ]; then
            pass "$service запущен (Up)"
        else
            warn "$service статус: $STATUS"
        fi
    else
        warn "$service не найден в docker-compose"
    fi
done

# =============================================================================
# 3. ПРОВЕРКА POSTGRESQL
# =============================================================================
section "3. POSTGRESQL"

if docker-compose exec -T postgres psql -U pixel_user -d pixel_db -c "SELECT 1" &> /dev/null; then
    pass "PostgreSQL подключение успешно"
    
    # Проверка таблиц
    TABLE_COUNT=$(docker-compose exec -T postgres psql -U pixel_user -d pixel_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    if [ "$TABLE_COUNT" -gt 0 ]; then
        pass "Таблиц в БД: $TABLE_COUNT"
    else
        warn "Таблицы не найдены или БД пуста"
    fi
    
    # Проверка конкретных таблиц
    for table in "portfolio" "partners" "contacts" "users"; do
        if docker-compose exec -T postgres psql -U pixel_user -d pixel_db -c "SELECT 1 FROM $table LIMIT 1;" &> /dev/null; then
            pass "Таблица '$table' существует"
        else
            warn "Таблица '$table' не найдена"
        fi
    done
else
    fail "PostgreSQL недоступен"
fi

# =============================================================================
# 4. ПРОВЕРКА MINIO
# =============================================================================
section "4. MINIO (S3)"

# Проверка MinIO API
if curl -s "$MINIO_CONSOLE/api/health" &> /dev/null || curl -s "http://localhost:9000/minio/health/live" &> /dev/null; then
    pass "MinIO API доступен"
else
    fail "MinIO API недоступен"
fi

# Проверка bucket
if docker-compose exec -T minio mc alias set local http://localhost:9000 ${S3_ACCESS_KEY:-minioadmin} ${S3_SECRET_KEY:-minioadmin} 2>/dev/null; then
    if docker-compose exec -T minio mc ls local/pixel-files &> /dev/null; then
        pass "Bucket 'pixel-files' существует"
        FILE_COUNT=$(docker-compose exec -T minio mc ls local/pixel-files 2>/dev/null | wc -l)
        info "Файлов в bucket: ~$FILE_COUNT"
    else
        warn "Bucket 'pixel-files' не найден"
    fi
else
    warn "MinIO client не настроен (mc)"
fi

info "MinIO Console: $MINIO_CONSOLE (логин: ${S3_ACCESS_KEY:-minioadmin})"

# =============================================================================
# 5. ПРОВЕРКА API
# =============================================================================
section "5. API BACKEND"

# Health check
HEALTH_RESPONSE=$(curl -s "$API_URL/health" 2>/dev/null || echo "")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    pass "API health check: OK"
    echo "    Response: $HEALTH_RESPONSE"
else
    fail "API health check не прошёл"
    info "Попытка: curl $API_URL/health"
fi

# Проверка endpoints
ENDPOINTS=("/api/portfolio" "/api/partners" "/api/contacts")
for endpoint in "${ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s "$API_URL$endpoint" 2>/dev/null | head -c 100)
    if [ -n "$RESPONSE" ]; then
        pass "API $endpoint доступен"
    else
        warn "API $endpoint не отвечает"
    fi
done

# =============================================================================
# 6. ПРОВЕРКА NGINX
# =============================================================================
section "6. NGINX"

# Проверка HTTP
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NGINX_URL" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    pass "Nginx HTTP: статус $HTTP_STATUS"
elif [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    warn "Nginx: редирект (статус $HTTP_STATUS) - возможно требуется SSL"
else
    warn "Nginx HTTP: статус $HTTP_STATUS"
fi

# Проверка HTTPS (если настроен)
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://localhost" 2>/dev/null || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    pass "Nginx HTTPS: статус $HTTPS_STATUS"
else
    warn "Nginx HTTPS: недоступен (статус $HTTPS_STATUS) - SSL не настроен"
fi

# =============================================================================
# 7. ПРОВЕРКА SSL
# =============================================================================
section "7. SSL СЕРТИФИКАТЫ"

CERT_DIR="$PROJECT_DIR/certbot/conf/live/pixel59.ru"
if [ -d "$CERT_DIR" ]; then
    if [ -f "$CERT_DIR/fullchain.pem" ]; then
        pass "SSL сертификат найден"
        
        # Проверка срока действия
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2)
        if [ -n "$EXPIRY_DATE" ]; then
            info "Сертификат истекает: $EXPIRY_DATE"
        fi
    else
        fail "Файл сертификата не найден"
    fi
else
    warn "Директория сертификатов не найдена"
    info "Для получения SSL: ./scripts/setup-ssl.sh pixel59.ru"
fi

# =============================================================================
# 8. ПРОВЕРКА FRONTEND
# =============================================================================
section "8. FRONTEND"

DIST_DIR="$PROJECT_DIR/dist"
if [ -d "$DIST_DIR" ]; then
    pass "Frontend dist директория существует"
    
    # Проверка index.html
    if [ -f "$DIST_DIR/index.html" ]; then
        pass "index.html найден"
    else
        fail "index.html не найден - требуется сборка: npm run build"
    fi
    
    # Проверка статических файлов
    ASSETS_COUNT=$(find "$DIST_DIR" -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
    info "Статических файлов: $ASSETS_COUNT"
else
    fail "Директория dist не найдена"
    info "Соберите frontend: npm run build"
fi

# =============================================================================
# 9. ПРОВЕРКА КОНФИГУРАЦИИ
# =============================================================================
section "9. КОНФИГУРАЦИЯ"

ENV_FILE="$PROJECT_DIR/server/.env"
if [ -f "$ENV_FILE" ]; then
    pass ".env файл найден"
    
    # Проверка критичных переменных
    VARS=("DB_PASSWORD" "JWT_SECRET" "S3_SECRET_KEY")
    for var in "${VARS[@]}"; do
        VALUE=$(grep "^$var=" "$ENV_FILE" 2>/dev/null | cut -d= -f2)
        if [ -n "$VALUE" ] && [ "$VALUE" != "your_*" ]; then
            pass "$var настроен"
        else
            warn "$var не настроен или значение по умолчанию"
        fi
    done
else
    fail ".env файл не найден"
fi

# =============================================================================
# 10. ПРОВЕРКА РЕСУРСОВ
# =============================================================================
section "10. РЕСУРСЫ СИСТЕМЫ"

# Docker stats
info "Использование контейнерами:"
docker stats --no-stream 2>/dev/null | head -10 || warn "Не удалось получить stats"

# Место на диске
DISK_USAGE=$(df -h "$PROJECT_DIR" 2>/dev/null | tail -1 | awk '{print $5 " used"}')
info "Диск: $DISK_USAGE"

# Память
MEMORY=$(free -h 2>/dev/null | tail -1 | awk '{print $3 "/" $2}')
info "Память: $MEMORY"

# =============================================================================
# РЕЗУЛЬТАТЫ
# =============================================================================
section "📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ"

echo ""
echo -e "${GREEN}✅ Пройдено:   $PASSED${NC}"
echo -e "${YELLOW}⚠️  Предупреждений: $WARNINGS${NC}"
echo -e "${RED}❌ Ошибок:      $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ВСЁ ГОТОВО!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Есть предупреждения, рекомендуется проверить${NC}"
    fi
    exit 0
else
    echo -e "${RED}🚨 ЕСТЬ ОШИБКИ!${NC}"
    echo "Проверьте логи:"
    echo "  docker-compose logs -f api"
    echo "  docker-compose logs -f nginx"
    echo "  docker-compose logs -f postgres"
    exit 1
fi
"