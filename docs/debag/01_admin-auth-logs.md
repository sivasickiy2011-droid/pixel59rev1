# Промпт: Укрепление auth-admin и admin-login-logs

## Контекст
- Опирайся на plan-of-record CI/CD и контрольные прогонки из [plans/gpt_agents/stage5.md:38-45](plans/gpt_agents/stage5.md:38-45).
- Обратись к рекомендациям по auth-admin с обязанным rate limiting, CAPTCHA, JWT и 2FA [plans/recommendations/auth-admin.md:17-84](plans/recommendations/auth-admin.md:17-84).
- Учитывай критичность admin-login-logs: аутентификация, фильтры, индексы и кэш [plans/recommendations/admin-login-logs.md:17-73](plans/recommendations/admin-login-logs.md:17-73).

## Основные задачи
1. Внедрить rate limiting (≤5 попыток/мин), CAPTCHA/хонеypot, блокировку IP после нескольких провалов и удалить отладочные print, чтобы закрыть путь к брутфорсу и утечкам.
2. Перевести auth-admin на JWT + refresh токены, добавить 2FA (код по SMS/Email) и вынести bcrypt в отдельный модуль для безопасного токен-менеджмента.
3. Сделать admin-login-logs защищённым: требовать JWT, ограничивать limit ≤100, вводить кэширование, индексы по created_at и success, фильтры по дате/IP/статусу и экспорт CSV/JSON.
4. Добавить метрики/alert при проваленных логинах и медленных SQL, health check БД и логирование долгих запросов.

## Статус реализации
- `auth-admin`: rate limiting (Redis counters), honeypot/CAPTCHA, IP lockout, двефакторка, JWT+refresh и логирование через Redis [`backend/auth-admin/index.py:1-196`](backend/auth-admin/index.py:1-196).
- Вынесена bcrypt-логика [`backend/auth-admin/bcrypt_utils.py:1-26`](backend/auth-admin/bcrypt_utils.py:1-26) и JWT-генерация [`backend/token_utils.py:1-47`](backend/token_utils.py:1-47).
- `admin-login-logs`: JWT-only, limit ≤100, индексы (уже есть), фильтры, кэш/экспорт/health-check и мониторинг медленных SQL [`backend/admin-login-logs/index.py:1-228`](backend/admin-login-logs/index.py:1-228).
- Обновлены зависимости (`redis`) и тесты для auth-admin с логином + refresh [`backend/auth-admin/tests.json:1-63`](backend/auth-admin/tests.json:1-63).

## Тестирование
- Backend: unit-тесты валидации, integration-тесты авторизации и логов, E2E через Playwright/pytest, нагрузка по rate limiting по plan-of-record [plans/gpt_agents/stage5.md:38-45](plans/gpt_agents/stage5.md:38-45).
- Frontend: прогонять UI-логин в админке, проверяя отображение капчи, статус rate limit, ввод 2FA, выдачу и обновление JWT; удостовериться, что журнал логов показывает фильтры и маски IP при 100 обращениях.
