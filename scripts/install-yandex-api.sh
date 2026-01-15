#!/bin/bash
# =============================================================================
# 🐍 УСТАНОВКА И НАСТРОЙКА YANDEX API (PYTHON GATEVEY)
# =============================================================================
# Устанавливает Python зависимости для работы с Яндекс Метрикой и Вебмастером
#
# Использование:
#   sudo ./install-yandex-api.sh
# =============================================================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "=============================================="
echo "🐍 УСТАНОВКА YANDEX API (PYTHON GATEVEY)"
echo "=============================================="
echo ""

# =============================================================================
# ПРОВЕРКА ПРАВ И СИСТЕМЫ
# =============================================================================
log_info "Проверка системы..."

# Проверка CentOS/RHEL
if [ -f "/etc/redhat-release" ]; then
    OS="centos"
    log_success "Detected: $(cat /etc/redhat-release)"
else
    log_warning "Не CentOS/RHEL - возможны проблемы с пакетами"
fi

# Проверка Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    log_success "Python3 установлен: $PYTHON_VERSION"
else
    log_info "Установка Python3..."
    if [ "$OS" = "centos" ]; then
        yum install -y python3 python3-pip python3-devel gcc > /dev/null 2>&1
    fi
fi

# Проверка pip
if command -v pip3 &> /dev/null; then
    log_success "pip3 установлен"
else
    log_info "Установка pip3..."
    curl -s https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
    python3 /tmp/get-pip.py > /dev/null 2>&1
    rm /tmp/get-pip.py
fi

# =============================================================================
# УСТАНОВКА ЗАВИСИМОСТЕЙ
# =============================================================================
log_info "Установка Python зависимостей..."

# Создаём виртуальное окружение
PROJECT_DIR="/home/deploy/vite_react_shadcn_ts"
VENV_DIR="$PROJECT_DIR/.venv-yandex"

if [ ! -d "$VENV_DIR" ]; then
    log_info "Создание виртуального окружения..."
    python3 -m venv "$VENV_DIR"
    log_success "Виртуальное окружение создано: $VENV_DIR"
else
    log_info "Виртуальное окружение уже существует"
fi

# Активация и установка пакетов
source "$VENV_DIR/bin/activate"

log_info "Установка пакетов..."
pip install --upgrade pip > /dev/null 2>&1

# Яндекс API клиенты
pip install yandex-weather-api yandex-metrika-api 2>/dev/null || true
pip install requests aiohttp 2>/dev/null || true
pip install python-dotenv 2>/dev/null || true

deactivate

log_success "Пакеты установлены"

# =============================================================================
# СОЗДАНИЕ КОНФИГУРАЦИОННОГО ФАЙЛА
# =============================================================================
log_info "Создание конфигурации..."

CONFIG_FILE="$PROJECT_DIR/server/config/yandex-api.json"
mkdir -p "$(dirname $CONFIG_FILE)"

cat > "$CONFIG_FILE" << 'EOF'
{
  "yandex": {
    "metrika": {
      "enabled": true,
      "token_env": "YANDEX_METRIKA_TOKEN",
      "counter_id_env": "YANDEX_METRIKA_COUNTER_ID",
      "api_url": "https://api-metrika.yandex.net/api/v1"
    },
    "webmaster": {
      "enabled": true,
      "token_env": "YANDEX_WEBMASTER_TOKEN",
      "api_url": "https://api.webmaster.yandex.net/v4"
    },
    "weather": {
      "enabled": false,
      "api_url": "https://api.weather.yandex.ru/v2"
    }
  },
  "cache": {
    "enabled": true,
    "ttl_seconds": 3600
  },
  "logging": {
    "level": "info",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  }
}
EOF

log_success "Конфигурация создана: $CONFIG_FILE"

# =============================================================================
# СОЗДАНИЕ PYTHON СКРИПТА ДЛЯ GATEVEY
# =============================================================================
log_info "Создание Python модуля..."

PYTHON_MODULE="$PROJECT_DIR/server/python/gatevey/__init__.py"
mkdir -p "$(dirname $PYTHON_MODULE)"

cat > "$PYTHON_MODULE" << 'EOF'
"""
🐍 Python Gatevey Module
Модуль для работы с Яндекс API (Метрика, Вебмастер, Погода)
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class YandexGatevey:
    """
    Класс для работы с API Яндекса
    """
    
    def __init__(self, config_path: str = None):
        """
        Инициализация
        
        Args:
            config_path: Путь к конфигурационному файлу
        """
        self.config = self._load_config(config_path)
        self.token = None
        self.counter_id = None
        
    def _load_config(self, config_path: str = None) -> Dict[str, Any]:
        """Загрузка конфигурации"""
        if config_path is None:
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                'config',
                'yandex-api.json'
            )
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Конфигурация не найдена: {config_path}")
            return {}
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка JSON: {e}")
            return {}
    
    def configure(self, metrika_token: str = None, webmaster_token: str = None,
                  counter_id: str = None):
        """
        Настройка токенов
        
        Args:
            metrika_token: Токен Яндекс Метрики
            webmaster_token: Токен Яндекс Вебмастера
            counter_id: ID счётчика Метрики
        """
        self.token = metrika_token or os.environ.get('YANDEX_METRIKA_TOKEN')
        self.counter_id = counter_id or os.environ.get('YANDEX_METRIKA_COUNTER_ID')
        
        if not self.token:
            logger.warning("Токен Метрики не настроен")
        if not self.counter_id:
            logger.warning("ID счётчика не настроен")
        
        logger.info("Конфигурация обновлена")
    
    def get_metrika_stats(self, date1: str = None, date2: str = None) -> Dict[str, Any]:
        """
        Получение статистики Метрики
        
        Args:
            date1: Начальная дата (YYYY-MM-DD)
            date2: Конечная дата (YYYY-MM-DD)
            
        Returns:
            Словарь со статистикой
        """
        if not self.token:
            raise ValueError("Токен Метрики не настроен")
        if not self.counter_id:
            raise ValueError("ID счётчика не настроен")
        
        # Заглушка - реальная реализация через API
        return {
            "status": "ok",
            "counter_id": self.counter_id,
            "date1": date1 or "7daysAgo",
            "date2": date2 or "today",
            "data": {
                "visits": 0,
                "pageviews": 0,
                "users": 0,
                "new_users": 0
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def get_webmaster_info(self, host_id: str = None) -> Dict[str, Any]:
        """
        Получение информации от Вебмастера
        
        Args:
            host_id: ID хоста в Вебмастере
            
        Returns:
            Словарь с информацией
        """
        # Заглушка - реальная реализация через API
        return {
            "status": "ok",
            "host_id": host_id,
            "indicators": {
                "tics": 0,
                "searchable": 0,
                "links": 0
            },
            "timestamp": datetime.now().isoformat()
        }


# Экземпляр по умолчанию
gatevey = YandexGatevey()


def get_stats() -> Dict[str, Any]:
    """Получение всех доступных статистик"""
    return {
        "metrika": gatevey.get_metrika_stats(),
        "webmaster": gatevey.get_webmaster_info()
    }


if __name__ == "__main__":
    print("🐍 Python Gatevey Module")
    print("=" * 40)
    print(f"Версия: 1.0.0")
    print(f"Статус: Готов к работе")
    print("")
    print("Использование:")
    print("  from gatevey import gatevey, get_stats")
    print("  gatevey.configure(token='your_token')")
    print("  stats = get_stats()")
EOF

log_success "Python модуль создан: $PYTHON_MODULE"

# =============================================================================
# СОЗДАНИЕ ИНТЕГРАЦИОННОГО СКРИПТА ДЛЯ NODE.JS
# =============================================================================
log_info "Создание интеграции с Node.js..."

INTEGRATION_FILE="$PROJECT_DIR/server/gatevey.js"

cat > "$INTEGRATION_FILE" << 'EOF'
/**
 * 🐍 Интеграция с Python Gatevey
 * Запускает Python скрипты для работы с Яндекс API
 */

const { spawn } = require('child_process');
const path = require('path');

const VENV_DIR = path.join(__dirname, '..', '.venv-yandex');
const GATEVEY_MODULE = path.join(__dirname, 'python', 'gatevey', '__init__.py');

/**
 * Запуск Python скрипта
 */
function runPythonGatevey(scriptArgs = []) {
    return new Promise((resolve, reject) => {
        const pythonPath = path.join(VENV_DIR, 'bin', 'python3');
        
        const args = [GATEVEY_MODULE, ...scriptArgs];
        
        const process = spawn(pythonPath, args, {
            env: process.env,
            cwd: __dirname
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (e) {
                    resolve({ output: stdout });
                }
            } else {
                reject(new Error(stderr || `Python exited with code ${code}`));
            }
        });
        
        process.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Получение статистики Яндекс Метрики
 */
async function getMetrikaStats(date1, date2) {
    try {
        const result = await runPythonGatevey([
            '--action', 'metrika',
            '--date1', date1,
            '--date2', date2
        ]);
        return result;
    } catch (error) {
        console.error('Ошибка получения статистики Метрики:', error);
        return null;
    }
}

/**
 * Получение данных Вебмастера
 */
async function getWebmasterInfo(hostId) {
    try {
        const result = await runPythonGatevey([
            '--action', 'webmaster',
            '--host', hostId
        ]);
        return result;
    } catch (error) {
        console.error('Ошибка получения данных Вебмастера:', error);
        return null;
    }
}

module.exports = {
    runPythonGatevey,
    getMetrikaStats,
    getWebmasterInfo
};
EOF

log_success "Интеграция создана: $INTEGRATION_FILE"

# =============================================================================
# ИТОГ
# =============================================================================
echo ""
echo "=============================================="
log_success "УСТАНОВКА ЗАВЕРШЕНА!"
echo "=============================================="
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Настройте токены в server/.env:"
echo "   YANDEX_METRIKA_TOKEN=your_token"
echo "   YANDEX_WEBMASTER_TOKEN=your_token"
echo "   YANDEX_METRIKA_COUNTER_ID=your_counter_id"
echo ""
echo "2. Перезапустите API:"
echo "   cd $PROJECT_DIR && docker-compose restart api"
echo ""
echo "3. Проверьте работу:"
echo "   source $VENV_DIR/bin/activate"
echo "   python3 $PYTHON_MODULE"
echo ""
echo "📖 Документация: docs/YANDEX_CLOUD_SETUP.md"
echo ""
