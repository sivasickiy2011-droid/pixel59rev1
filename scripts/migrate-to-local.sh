#!/bin/bash
# =============================================================================
# 🚀 СКРИПТ МИГРАЦИИ НА ЛОКАЛЬНЫЕ РЕСУРСЫ
# =============================================================================
# Скачивает все внешние картинки и заменяет ссылки на локальные
# Удаляет внешние скрипты аналитики
# =============================================================================

set -e

PROJECT_DIR="/home/deploy/vite_react_shadcn_ts"
cd "$PROJECT_DIR"

echo ""
echo "=============================================="
echo "🚀 МИГРАЦИЯ НА ЛОКАЛЬНЫЕ РЕСУРСЫ"
echo "=============================================="
echo ""

# Создаём папку для картинок
mkdir -p public/img

echo "📥 ШАГ 1: Скачивание картинок..."
echo ""

# Функция для скачивания картинки
download_image() {
    local url="$1"
    local filename=$(basename "$url" | cut -d'?' -f1)
    local filepath="public/img/$filename"
    
    if [ -f "$filepath" ]; then
        echo "  ⏭️  Пропуск (уже есть): $filename"
    else
        echo "  ⬇️  Скачивание: $filename"
        curl -sL "$url" -o "$filepath" 2>/dev/null
        
        if [ -s "$filepath" ]; then
            echo "  ✅ Сохранено: $filepath"
        else
            echo "  ❌ Ошибка загрузки: $url"
            rm -f "$filepath"
        fi
    fi
}

# Список картинок для скачивания
IMAGES=(
    "https://cdn.poehali.dev/files/6a8b2eeb-b116-495c-b4a5-d7a1150fde37.png"
    "https://cdn.poehali.dev/files/5e53ea79-1c81-4c3f-847b-e8a82a5743c2.png"
)

for img in "${IMAGES[@]}"; do
    download_image "$img"
done

echo ""
echo "🔗 ШАГ 2: Замена ссылок на картинки..."
echo ""

# Замена ссылок на картинки в HTML файлах
for html in dist/*.html; do
    if [ -f "$html" ]; then
        echo "  📝 Обработка: $html"
        
        # Замена cdn.poehali.dev/files на /img
        sed -i 's|https://cdn.poehali.dev/files/|/img/|g' "$html"
        sed -i 's|https://cdn.poehali.dev/|/img/|g' "$html"
        
        echo "  ✅ Готово"
    fi
done

# Замена в tsx/tsx файлах
for file in src/**/*.tsx src/**/*.tsx; do
    if [ -f "$file" ]; then
        sed -i 's|https://cdn.poehali.dev/files/|/img/|g' "$file"
        sed -i 's|https://cdn.poehali.dev/|/img/|g' "$file"
    fi
done

echo ""
echo "🗑️  ШАГ 3: Удаление внешних скриптов..."
echo ""

# Удаление внешних скриптов из index.html
if [ -f "index.html" ]; then
    echo "  📝 Обработка: index.html"
    
    # Удаление скриптов poehali.dev
    sed -i '/cdn.poehali.dev\/intertnal\/js/d' index.html
    sed -i '/poehali.dev\/intertnal/d' index.html
    sed -i '/src="https:\/\/cdn.poehali.dev/d' index.html
    sed -i '/src="https:\/\/mc.yandex.ru/d' index.html
    sed -i '/Yandex.Metrika counter/d' index.html
    sed -i '/ym(/,/)<\/script>/d' index.html
    sed -i '/<noscript>/,/\/noscript>/d' index.html
    sed -i '/yandex-verification/d' index.html
    sed -i '/pp-name/d' index.html
    
    echo "  ✅ Готово"
fi

echo ""
echo "🔄 ШАГ 4: Пересборка фронтенда..."
echo ""

npm run build

# Копирование в nginx
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/
sudo chmod -R 755 /usr/share/nginx/html/

# Перезапуск nginx
sudo systemctl restart nginx

echo ""
echo "=============================================="
echo "✅ МИГРАЦИЯ ЗАВЕРШЕНА!"
echo "=============================================="
echo ""
echo "📁 Локальные картинки: public/img/"
echo "🌐 Проверьте: http://172.16.57.77"
echo ""
