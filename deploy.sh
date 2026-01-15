#!/bin/bash
echo "�� Начало обновления..."

# Получить изменения
git pull origin main

# Пересобрать
npm run build

# Обновить Nginx
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/
sudo chmod -R 755 /usr/share/nginx/html/

# Перезапустить API
pm2 restart api
sudo systemctl restart nginx

echo "✅ Готово!"
