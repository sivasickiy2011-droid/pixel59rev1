#!/bin/bash
# Скрипт для экспорта базы данных из poehali.dev

echo "📦 Экспорт базы данных из poehali.dev..."

# Укажите данные подключения к вашей БД на poehali.dev
DB_HOST="your-poehali-db-host"
DB_PORT="5432"
DB_NAME="your-db-name"
DB_USER="your-db-user"

# Файл для сохранения дампа
DUMP_FILE="db_export_$(date +%Y%m%d_%H%M%S).sql"

echo "Подключение к базе данных..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"

# Экспорт базы данных
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F p \
  --clean \
  --if-exists \
  -f $DUMP_FILE

if [ $? -eq 0 ]; then
    echo "✅ База данных успешно экспортирована в файл: $DUMP_FILE"
    echo "📊 Размер файла: $(du -h $DUMP_FILE | cut -f1)"
else
    echo "❌ Ошибка при экспорте базы данных"
    exit 1
fi
