# Развёртывание на CentOS 9 Stream

## 2026-01-21T20:32:00Z
- Предварительные требования
  - Установить Node.js 20.x из модуля `nodejs:20`. Проверить через `node -v` и `npm -v`.
  - Настроить Python 3.11 (или выше) virtualenv: `python -m venv /srv/venv/app`, затем `source /srv/venv/app/bin/activate` и `pip install -r requirements.txt`.
- Декомпозиция и сервисы
  - `app-frontend.service` (systemd) запускает `npm run dev` или `npm run build && npm run serve` из `/home/deploy/vite_react_shadcn_ts`. Пример Unit:
    ```ini
    [Unit]
    Description=Pixel59 Frontend
    After=network.target

    [Service]
    Type=simple
    User=deploy
    WorkingDirectory=/home/deploy/vite_react_shadcn_ts
    ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0 --port 3000
    Restart=always
    StandardOutput=journal
    StandardError=journal
    Environment=NODE_ENV=production

    [Install]
    WantedBy=multi-user.target
    ```
  - `app-backend.service` запускает `gunicorn backend.entry:app` или аналог в `/srv/venv/app`. Добавить `EnvironmentFile=/etc/default/app-backend` для `DATABASE_URL` и `ADMIN_TOKEN_SECRET`.
- Прокси и SELinux
  - Proxy Express (`server/api/uuid.js`) устанавливается как `node server/server.js`; экспортировать `PORT=8080` и `GATEVEY_PORT=3002`.
  - Если SELinux включён, применить `sudo semanage fcontext -a -t httpd_sys_rw_content_t '/home/deploy/vite_react_shadcn_ts/public(/.*)?'` и `restorecon -R`. Разрешить порт `3000/tcp` и `8080/tcp` через `firewall-cmd --permanent --add-port=3000/tcp --add-port=8080/tcp && firewall-cmd --reload`.
- Проверки
  - `npm install && npm run build` собирают фронтенд.
  - `npm run test` (если есть) проверяет vitest/playwright.
  - `source /srv/venv/app/bin/activate && python -m pytest` проверяет backend.
  - `curl -H "x-admin-token:$ADMIN_TOKEN" -X DELETE https://pixel59.ru/api/99ddd15c-93b5-4d9e-8536-31e6f6630304 -d '{"id":123}'` гарантирует DELETE проксируется с телом.
