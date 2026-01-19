# Как применить исправления на продакшене

## Требуемый доступ
- Права на редактирование файлов конфигурации nginx (sudo) 
- Доступ к pm2 для перезапуска Node.js сервера

## Предварительные шаги
1. **Сделать бэкап существующих файлов:**
```bash
# Фронтенд
cp dist/admin-login-*.js dist/admin-login-backup.js

# Конфигурация nginx
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# pm2 процессы
pm2 save
```
2. **Остановить фронтенд** (если работает через pm2):
```bash
pm2 stop frontend
```

## Шаг 1 — Обновить фронтенд (React)

### 1.1. Изменить UUID в исходниках
Если вы хотите убедиться, что UUID исправлен во всех местах:

```bash
# Найти все упоминания fcfd14ca...
grep -r "fcfd14ca" src/
# Изменить в найденных файлах
sed -i 's/fcfd14ca-b5b0-4e96-bd94-e4db4df256d5/743e5e24-86d0-4a6a-90ac-c71d80a5b822/g' src/pages/AdminLogin.tsx src/components/services/PartnerLogin.tsx
```

### 1.2. Собрать проект
```bash
cd /home/deploy/vite_react_shadcn_ts
npm run build  # или bun run build
```

### 1.3. Скопировать собранные файлы
```bash
# Скопировать новые файлы в папку nginx
sudo cp -r dist/* /var/www/pixel59.ru/dist/
```

**Или использовать скрипт деплоя:**
```bash
./quick-deploy.sh
```

## Шаг 2 — Обновить конфигурацию nginx

### 2.1. Применить изменения в nginx.conf
```bash
# Открыть конфиг
sudo nano /etc/nginx/nginx.conf
```

Найти блок server для `pixel59.ru` (обычно в секции `listen 443 ssl`).

Добавить следующий location **перед** существующими location `(/api/ai-chat/:|/api/ollama/)`:

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2.2. Проверить синтаксис и перезагрузить
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 3 — Перезапустить Node.js сервер

### 3.1. Перезапустить pm2 процессы
```bash
pm2 restart api
```

### 3.2. Проверить статус
```bash
pm2 status api
```

## Шаг 4 — Проверить работу

### 4.1. Проверить API
```bash
curl -k https://172.16.57.77/api/partners
```

Ожидаемый результат: JSON, а не HTML.

**Пример правильного ответа:**
```json
[{"id": 1, "name": "Company A"}]
```

### 4.2. Проверить админ-панель
1. Откройте `https://172.16.57.77/admin/login`
2. Введите пароль `Xw1Utoce1`
3. Убедитесь, что вход проходит успешно (редирект на `/admin/dashboard`).
4. Откройте консоль разработчика (F12) → вкладка «Сеть». Должен быть успешный POST на `/api/743e5e24-86d0-4a6a-90ac-c71d80a5b822`.

### 4.3. Проверить отсутствие ошибок в консоли
- Отсутствие `Unexpected token '<'`
- Отсутствие `405 Method Not Allowed`
- Все изображения загружаются

## Шаг 5 — Дополнительные проверки

### 5.1. Проверить логи nginx
```bash
sudo tail -f /var/log/nginx/error.log
```

### 5.2. Проверить логи Node.js
```bash
pm2 logs api
```

### 5.3. Проверить логи Python-функций
```bash
cat ~/.gigaide/logs/auth-admin.log
```

## Шаг 6 — Откат изменений (если что-то пошло не так)

### 6.1. Восстановить фронтенд из бэкапа
```bash
# Если использовался backup
sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
sudo systemctl reload nginx
```

### 6.2. Вернуть старый UUID
```bash
sed -i 's/743e5e24-86d0-4a6a-90ac-c71d80a5b822/fcfd14ca-b5b0-4e96-bd94-e4db4df256d5/g' src/pages/AdminLogin.tsx
npm run build
```

## Проблемы и решения

**Проблема:** После изменений API всё ещё возвращает HTML.
**Решение:** Проверьте, правильно ли добавлен location `/api` в nginx.conf. Убедитесь, что location описан до других location, которые могут перекрывать его.

**Проблема:** 405 ошибка для старого UUID.
**Решение:** Перезапустите pm2 процессы и убедитесь, что функция `auth-admin` работает (проверьте logs).

**Проблема:** Изображение не загружается.
**Решение:** Убедитесь, что файл существует в `dist/img/`. Проверьте права доступа.

## Мониторинг после внедрения исправлений

1. **Проверить логи ошибок nginx:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```

2. **Проверить логи Node.js сервера:**
   ```bash
   pm2 logs api --lines 50
   ```

3. **Проверить логи Python-функций:**
   ```bash
   cat ~/.gigaide/logs/auth-admin.log | grep ERROR
   ```

4. **Убедиться, что количество успешных входов возросло** (можно проверить через БД).

## Контакты
- Разработчик: ...
- Системный администратор: ...

---
*Обновлено: 18.01.2026*