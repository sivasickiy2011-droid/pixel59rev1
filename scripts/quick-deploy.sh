#!/bin/bash
# =============================================================================
# ⚡ БЫСТРОЕ РАЗВЁРТЫВАНИЕ PROJECTA (ВСЕ В ОДНОМ)
# =============================================================================
# Полный скрипт развёртывания для CentOS 9 Stream
#
# Использование:
#   sudo ./quick-deploy.sh           # Базовое развёртывание
#   sudo ./quick-deploy.sh --full    # С Python Gatevey и SSL
#   sudo ./quick-deploy.sh --check   # Только проверка
# =============================================================================

set -e

# Конфигурация
PROJECT_DIR="/home/deploy/vite_react_shadcn_ts"
DOMAIN="pixel59.ru"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Функции
log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"; }
ok() { echo -e "${GREEN}[✓]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
section() { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN} $1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }

# =============================================================================
# ПАРСИНГ АРГУМЕНТОВ
# =============================================================================
MODE="basic"
for arg in "$@"; do
    case $arg in
        --full)
            MODE="full"
            shift
            ;;
        --check)
            MODE="check"
            shift
            ;;
        --help|-h)
            echo "Использование: $0 [РЕЖИМ]"
            echo ""
            echo "РЕЖИМЫ:"
            echo "  (без аргументов)  Базовое развёртывание"
            echo "  --full            Полное развёртывание + Python Gatevey + SSL"
            echo "  --check           Только проверка системы"
            echo "  --help            Показать справку"
            exit 0
            ;;
    esac
done

# =============================================================================
# НАЧАЛО
# =============================================================================
clear
section "⚡ QUICK DEPLOY - PROJECTA"
echo -e "${CYAN}Режим:${NC} $MODE"
echo -e "${CYAN}Проект:${NC} $PROJECT_DIR"
echo -e "${CYAN}Домен:${NC} $DOMAIN"
echo ""

# Проверка прав
if [ "$EUID" -ne 0 ]; then
    err "Запустите с правами root: sudo $0"
fi

# =============================================================================
# ЭТАП 1: УСТАНОВКА DOCKER
# =============================================================================
section "1/5. УСТАНОВКА DOCKER"

log "Обновление системы..."
yum update -y > /dev/null 2>&1
ok "Система обновлена"

log "Установка Docker..."
if ! command -v docker &> /dev/null; then
    yum install -y yum-utils > /dev/null 2>&1
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo > /dev/null 2>&1
    yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null 2>&1
    systemctl start docker
    systemctl enable docker
    ok "Docker установлен"
else
    ok "Docker уже установлен: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
fi

# =============================================================================
# ЭТАП 2: НАСТРОЙКА FIREWALL
# =============================================================================
section "2/5. НАСТРОЙКА FIREWALL"

log "Настройка firewalld..."
systemctl start firewalld 2>/dev/null || true
systemctl enable firewalld 2>/dev/null || true
firewall-cmd --permanent --add-service=ssh > /dev/null 2>&1 || true
firewall-cmd --permanent --add-service=http > /dev/null 2>&1 || true
firewall-cmd --permanent --add-service=https > /dev/null 2>&1 || true
firewall-cmd --permanent --add-port=9000/tcp > /dev/null 2>&1 || true
firewall-cmd --permanent --add-port=9001/tcp > /dev/null 2>&1 || true
firewall-cmd --reload > /dev/null 2>&1 || true
ok "Firewall настроен"

# =============================================================================
# ЭТАП 3: КОНФИГУРАЦИЯ
# =============================================================================
section "3/5. КОНФИГУРАЦИЯ PROJECTA"

cd "$PROJECT_DIR"

# Проверка .env
if [ ! -f "server/.env" ]; then
    log "Создание .env из шаблона..."
    cp server/.env.example server/.env
    warn "Отредактируйте server/.env перед продолжением!"
    echo ""
    echo "📝 ОТРЕДАКТИРУЙТЕ .env:"
    echo "   nano $PROJECT_DIR/server/.env"
    echo ""
    read -p "Нажмите Enter после редактирования..."
else
    ok ".env найден"
fi

# =============================================================================
# ЭТАП 4: ЗАПУСК КОНТЕЙНЕРОВ
# =============================================================================
section "4/5. ЗАПУСК DOCKER COMPOSE"

log "Остановка старых контейнеров..."
docker-compose down 2>/dev/null || true

log "Запуск контейнеров..."
docker-compose up -d --build

log "Ожидание запуска..."
sleep 10

# Проверка статуса
CONTAINERS=$(docker-compose ps -q | wc -l)
if [ "$CONTAINERS" -ge 5 ]; then
    ok "Запущено контейнеров: $CONTAINERS"
else
    warn "Запущено контейнеров: $CONTAINERS (ожидалось 5)"
fi

docker-compose ps

# =============================================================================
# ЭТАП 5: ПРОВЕРКА
# =============================================================================
section "5/5. ПРОВЕРКА"

log "Проверка сервисов..."

# API
API_STATUS=$(curl -s http://localhost:3001/health 2>/dev/null | grep -c "ok" || echo "0")
if [ "$API_STATUS" -gt 0 ]; then
    ok "API работает"
else
    warn "API не отвечает"
fi

# PostgreSQL
if docker-compose exec -T postgres pg_isready -U pixel_user &> /dev/null; then
    ok "PostgreSQL готов"
else
    warn "PostgreSQL не готов"
fi

# MinIO
if curl -s http://localhost:9000/minio/health/live | grep -q "OK" 2>/dev/null; then
    ok "MinIO работает"
else
    warn "MinIO не отвечает"
fi

# Nginx
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    ok "Nginx работает (код: $HTTP_CODE)"
else
    warn "Nginx не отвечает (код: $HTTP_CODE)"
fi

# =============================================================================
# РЕЖИМ FULL: PYTHON GATEVEY
# =============================================================================
if [ "$MODE" = "full" ]; then
    section "+ PYTHON GATEVEY"
    
    log "Установка Python зависимостей..."
    ./scripts/install-yandex-api.sh > /dev/null 2>&1
    ok "Python Gatevey установлен"
    
    log "Настройка SSL..."
    ./scripts/setup-ssl.sh $DOMAIN 2>/dev/null || warn "SSL не настроен (проверьте DNS)"
fi

# =============================================================================
# РЕЖИМ CHECK
# =============================================================================
if [ "$MODE" = "check" ]; then
    log "Запуск проверки..."
    ./scripts/verify-deployment.sh
    exit 0
fi

# =============================================================================
# ФИНАЛ
# =============================================================================
section "✅ РАЗВЁРТЫВАНИЕ ЗАВЕРШЕНО"

echo ""
echo -e "${GREEN}🎉 Поздравляем!${NC}"
echo ""
echo "📋 Доступные команды:"
echo ""
echo "  Просмотр логов:"
echo "    docker-compose logs -f api"
echo "    docker-compose logs -f nginx"
echo ""
echo "  Перезапуск:"
echo "    docker-compose restart"
echo ""
echo "  Health check:"
echo "    ./scripts/health-check.sh"
echo ""
echo "  Проверка развёртывания:"
echo "    ./scripts/verify-deployment.sh"
echo ""
echo "🌐 URLs:"
echo "  Главный сайт:   http://localhost"
echo "  API:            http://localhost:3001/api"
echo "  MinIO Console:  http://localhost:9001"
echo ""
echo "📖 Документация: docs/"
echo ""
