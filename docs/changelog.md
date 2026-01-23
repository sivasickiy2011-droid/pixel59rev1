# Changelog

## 2026-01-21T20:32:00Z
- Защищены редакторы контента:
  - `PartnersAdmin` теперь валидирует, что сервер вернул массив, и всегда шлёт `requireAdminAuthHeaders` с JSON-запросами.
  - `NewsAdmin` логирует и показывает сообщение, если ответ API не содержит массива, и согласует заголовки с админским токеном.
  - `PortfolioAdmin` и вспомогательные прокси (`python-gatevey/main.py`, `server/api/uuid.js`) теперь обрабатывают тело DELETE-запросов, чтобы backend получал `id`.
  - Добавлены инструкции по развертыванию и архитектурные заметки (CentOS 9, декомпозиция `ContentAdmin`).

## 2026-01-22T07:09:00Z
- Устранены мелкие несоответствия backend:
  - `services-admin` и `news-feed` теперь используют `typing.Optional` вместо синтаксиса `| None`, чтобы убрать `Unsupported operand type(s)` в версиях Python <3.11 и сделать аннотации читаемыми.
  - Описание `backend.service` дополнили корректным `SELinuxContext` и `StandardError`, что позволяет systemd-процессу работать в ожидаемом контексте для CentOS 9 Stream.
