#!/bin/bash
# =============================================================================
# 🚀 СКРИПТ ПОЛНОГО РАЗВЁРТЫВАНИЯ PROJECTA НА CENTOS 9 STREAM
# =============================================================================
# Использование:
#   sudo ./deploy-centos9.sh
#
# Требования:
#   - CentOS Stream 9
#   - Права root (sudo)
#   - Доступ к интернету
# =============================================================================

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции вывода
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# КОНФИГУРАЦИЯ
# =============================================================================
PROJECT_DIR="/home/deploy/vite_react_shadcn_ts"
ENV_FILE="$PROJECT_DIR/server/.env"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

echo ""
echo "=============================================="
echo "🚀 РАЗВЁРТЫВАНИЕ PROJECTA НА CENTOS 9 STREAM"
echo "=============================================="
echo ""

# =============================================================================
# ПРОВЕРКА ПРАВ
# =============================================================================
log_info "Проверка прав доступа..."
if [ "$EUID" -ne 0 ]; then
    log_error "Запустите скрипт с правами root: sudo $0"
    exit 1
fi
log_success "Права root подтверждены"

# =============================================================================
# ШАГ 1: ОБНОВЛЕНИЕ СИСТЕМЫ
# =============================================================================
log_info "Шаг 1/6: Обновление системы..."
yum update -y > /dev/null 2>&1
log_success "Система обновлена"

# =============================================================================
# ШАГ 2: УСТАНОВКА DOCKER
# =============================================================================
log_info "Шаг 2/6: Установка Docker и Docker Compose..."

# Установка необходимых пакетов
yum install -y curl wget git nano yum-utils ca-certificates > /dev/null 2>&1

# Установка Docker
if ! command -v docker &> /dev/null; then
    log_info "Установка Docker..."
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo > /dev/null 2>&1
    yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin > /dev/null 2>&1
    
    # Запуск и включение Docker
    systemctl start docker
    systemctl enable docker
    log_success "Docker установлен"
else
    log_success "Docker уже установлен: $(docker --version)"
fi

# Установка Docker Compose (если не установлен как плагин)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_info "Установка Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose > /dev/null 2>&1
    chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose установлен"
else
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose уже установлен: $(docker-compose --version)"
    else
        log_success "Docker Compose (plugin) уже установлен"
    fi
fi

# =============================================================================
# ШАГ 3: НАСТРОЙКА FIREWALL
# =============================================================================
log_info "Шаг 3/6: Настройка firewall..."

# Установка и запуск firewalld если не установлен
if ! command -v firewall-cmd &> /dev/null; then
    yum install -y firewalld > /dev/null 2>&1
fi

systemctl start firewalld 2>/dev/null || true
systemctl enable firewalld 2>/dev/null || true

# Открытие портов
firewall-cmd --permanent --add-service=ssh 2>/dev/null || true
firewall-cmd --permanent --add-service=http 2>/dev/null || true
firewall-cmd --permanent --add-service=https 2>/dev/null || true
firewall-cmd --permanent --add-port=9000/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=9001/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

log_success "Firewall настроен"

# =============================================================================
# ШАГ 4: ПРОВЕРКА КОНФИГУРАЦИИ PROJECTA
# =============================================================================
log_info "Шаг 4/6: Проверка конфигурации проекта..."

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "docker-compose.yml не найден в $COMPOSE_FILE"
    exit 1
fi
log_success "docker-compose.yml найден"

if [ ! -f "$ENV_FILE" ]; then
    log_warning ".env файл не найден, создаём из шаблона..."
    if [ -f "$PROJECT_DIR/server/.env.example" ]; then
        cp "$PROJECT_DIR/server/.env.example" "$ENV_FILE"
        log_success "Создан $ENV_FILE из .env.example"
        log_warning "Отредактируйте $ENV_FILE перед запуском!"
    else
        log_error "Шаблон .env.example не найден"
        exit 1
    fi
else
    log_success ".env файл найден"
fi

# =============================================================================
# ШАГ 5: ЗАПУСК DOCKER COMPOSE
# =============================================================================
log_info "Шаг 5/6: Запуск контейнеров..."

cd "$PROJECT_DIR"

# Остановка существующих контейнеров если есть
docker-compose down 2>/dev/null || true

# Запуск контейнеров
docker-compose up -d --build

log_success "Контейнеры запущены"

# =============================================================================
# ШАГ 6: ПРОВЕРКА СТАТУСА
# =============================================================================
log_info "Шаг 6/6: Проверка статуса сервисов..."

sleep 5

echo ""
echo "----------------------------------------------"
echo "📊 СТАТУС КОНТЕЙНЕРОВ:"
echo "----------------------------------------------"
docker-compose ps

echo ""
echo "=============================================="
log_success "РАЗВЁРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "=============================================="
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Проверьте .env файл:"
echo "   nano $ENV_FILE"
echo ""
echo "2. Перезапустите контейнеры после изменения .env:"
echo "   cd $PROJECT_DIR && docker-compose restart api"
echo ""
echo "3. Проверьте логи:"
echo "   cd $PROJECT_DIR && docker-compose logs -f api"
echo ""
echo "4. Откройте в браузере:"
echo "   - Главный сайт: http://localhost"
echo "   - API: http://localhost/api/health"
echo "   - MinIO Console: http://localhost:9001"
echo ""
echo "📖 Документация: $PROJECT_DIR/docs/"
echo ""
"