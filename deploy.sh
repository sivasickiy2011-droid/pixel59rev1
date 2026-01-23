#!/bin/bash
echo "🚀 Начало обновления..."

# Удалите старую папку dist от nginx
sudo rm -rf /home/deploy/vite_react_shadcn_ts/dist

# Получить изменения
git pull origin main

# Пересобрать
npm run build

# Права
sudo chmod -R 755 dist

# Обновить Nginx
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/
sudo chmod -R 755 /usr/share/nginx/html/

# Применить Nginx конфиг из проекта
if [ -f "./nginx.conf" ]; then
  sudo cp ./nginx.conf /etc/nginx/nginx.conf
fi

# Перезапустить сервисы
pm2 restart api
pm2 restart gatevey
pm2 restart ollama
sudo systemctl restart nginx

echo "✅ Готово!"
echo "🌐 Сайт: http://172.16.57.77"
echo "🔧 API: http://172.16.57.77/api/portfolio"
echo "🐍 Gatevey: http://172.16.57.77/gatevey/health"
