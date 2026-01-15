#!/bin/bash
# Скрипт для импорта базы данных в новый сервер

if [ -z "$1" ]; then
    echo "❌ Укажите файл дампа базы данных"
    echo "Использование: ./import-database.sh <dump-file.sql>"
    exit 1
fi

DUMP_FILE=$1

if [ ! -f "$DUMP_FILE" ]; then
    echo "❌ Файл не найден: $DUMP_FILE"
    exit 1
fi

echo "📥 Импорт базы данных из файла: $DUMP_FILE"

# Загрузка переменных окружения
source ../server/.env

echo "Подключение к базе данных..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"

# Импорт базы данных
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -f $DUMP_FILE

if [ $? -eq 0 ]; then
    echo "✅ База данных успешно импортирована"
    
    # Проверка количества таблиц
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    echo "📊 Количество таблиц: $TABLE_COUNT"
else
    echo "❌ Ошибка при импорте базы данных"
    exit 1
fi
