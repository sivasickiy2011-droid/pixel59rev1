# План реализации по `docs/debag/05_secure-partners.md`

Каждый раздел ниже представляет собой согласованную подпроцессную дорожную карту: ключевые цели, четкие шаги и контрольные точки. Метрики/логи/артефакты отслеживаются в `reports/ci/` и сопутствующих таблицах.

## 1. secure-settings

### Цели
- Вынести шифрование и ротацию ключей в повторно используемый helper, сделать конфигурацию управляемой через CI/CD.
- Гарантировать, что операции с секретами логируются, валидируются и выставлены за пределы админов.
- Поддерживать наблюдаемость и возможность отката через системные версии.

### Ключевые шаги
1. Переписать `backend/secure-settings/index.py:1-342`, чтобы использовать Fernet из `backend/_shared/security.py`, реализовать helper для key management/rotation и `get_cipher()` с загрузкой из CI/CD-переменных.
2. Добавить middleware JWT с ролями `admin/viewer` в `server/api/*`, вынести валидацию ключей/значений (макс. длина, email/url/number-шаблоны) и sanitize inputs перед записью.
3. Вести audit log (request_id, user_id, IP, before/after), сохранять версии в `secure_settings_versions`, добавить POST `/api/secure-settings/rollback`, задокументировать payload.
4. Создать materialized views `secure_settings_by_category` и `secure_settings_recent`, внедрить health-check `/api/secure-settings/health`, rate limiter checks через gateway/Express proxy.
5. Экспортировать метрики шифрования/validation failures/rate limit rejects в Prometheus и сохранять итоговый JSON в `reports/ci/secure-settings-metrics.json` после фаз lint/test/load.

## 2. partner-auth и partners

### Цели
- Усилить хранение учётных данных и защиту токенов партнеров.
- Обеспечить отказоустойчивость через логирование, метрики и rate limiting.

### Ключевые шаги
1. Перевести хранение паролей на bcrypt/Argon2 + соление, запускать хеширование при CRUD в `backend/partners/index.py:1-306`.
2. Реализовать JWT access + refresh tokens с endpoint `/api/partner-auth/refresh`, refresh_id/rotation управляются из secure-settings, фронт отображает rate limit/lockout статусы.
3. Перейти на `psycopg2.pool.ThreadedConnectionPool`, обеспечить parameterized queries и логирование в `partner_auth_log` (success/fail/IP/headers), добавить алерт при 5%+ failed logins в 5 минут.
4. Ввести rate limit и lockout (3 ошибки → 15 минут блокировки), audit-события (updated_by, request_id), хранить версии в `partners_versions` с `jsonb payload`.
5. Обновить partner API под JWT (включая middleware и документацию), добавить метрики latency/errors и отчёт `reports/ci/partner-auth-metrics.json`.

## 3. upload-image

### Цели
- Гарантировать безопасную загрузку файлов, контроль payload, быстрое реагирование на вирусы и сбои хранения.

### Ключевые шаги
1. Проверять JWT роли (`server/middleware/auth.js` или Lambda authorizer) до обработки, разрешённые MIME `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, сверять magic bytes (`ffd8`, `89504e47`, `52494646`).
2. Ограничить payload 10 МБ (headers+payload), возвращать 413/422 + логировать, генерировать уникальные имена (UUID+timestamp) и metadata log (request_id, tenant, size, mime).
3. Реализовать retry с exponential backoff ×3, ограничить concurrency (ThreadPoolExecutor/семафор max 8), запускать фоновые вирус-сканы (ClamAV/Yara), результат записать в `upload_image_metrics`; при заражении удалять файл и заводить alert/`reports/ci/upload-image-violations.json`.
4. Для ошибок S3/локального хранилища использовать retry с jitter и отправлять фатальные записи в DLQ и `reports/ci/upload-image-failures.json`.

## 4. Наблюдаемость, health-checks и CI/CD

### Цели
- Сделать понятным, что мониторится, как оповещается команда и какие артефакты сохраняются в CI.

### Ключевые шаги
1. Логировать usage, JWT errors, upload failures, rate limit rejects, slow ops >400 мс (дополнительно slow query plan через `backend/_shared/logging.py`), результаты публиковать в `reports/ci/secure-settings-metrics.json`, `reports/ci/partner-auth-metrics.json`, `reports/ci/upload-image-metrics.json`.
2. Включить alerts на ошибки шифрования/JWT/upload scan, slow requests; оповещения доставляются в Slack/webhook/email (`#ci-alerts`, ops@company.ru).
3. Расширить `scripts/health-check.sh`: проверка DB, rate limiter, upload queue depth, логировать JSON в `reports/ci/health.json`.
4. Уточнить CI/CD plan-of-record (lint/test/load), сохранять артефакты/метрики в `reports/ci/`, связывать alerts и health-check результаты с пользовательскими процессами и runbook.

## 5. Тестирование и отчёты

### Цели
- Обеспечить покрытие backend, frontend и нагрузочное тестирование, закрепить retention артефактов.

### Ключевые шаги
1. Добавить backend unit/integration тесты: Fernet workflows, validation, JWT access/refresh, upload limits/virus scan, audit и rate limiting; покрыть E2E по workflows (secure-settings, partner auth, upload image) с нагрузкой 100 RPS на upload-image.
2. Frontend Vitest/Playwright проверяет формы загрузки (MIME, errors, прогресс, alerts), визуализацию статусов и реагирование на rate limit.
3. Уточнить retention: регрессионные артефакты (`reports/ci/alerts.json`, `reports/ci/health.json`, `secure_settings_versions`, `partner_auth_log`) должны храниться по регламенту и быть доступны в CI/UI.
