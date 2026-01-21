# Промпт: Аналитика и логирование (track-visit, get-analytics, bot-logger, bot-stats)

## Контекст
- Использовать `plan-of-record` из [plans/gpt_agents/stage5.md:29-47](plans/gpt_agents/stage5.md:29-47) для требований по load/alerts, метрикам latency, queue depth, экспортам и health checks.
- Детализировать рекомендации по `track-visit`, `get-analytics`, `bot-logger` и `bot-stats` с акцентом на rate limiting, индексы, кэширование, connection pooling и безопасность (см. соответствующие файлы `plans/recommendations/*.md`).
- Фронтенд-скипты (OwnStatsTab, metric beacons) должны гарантировать, что аналитика получает только валидный трафик, а логи ботов защищены от публичного доступа.

## План-оф-рекорд и требования
- `track-visit`, `get-analytics`, `bot-logger` находятся в приоритете High согласно [plans/gpt_agents/stage5.md:9-18](plans/gpt_agents/stage5.md:9-18); требования к latency < 400 мс, load-цели Locust 50–100 RPS и alert на error rate > 2% сохраняются.
- Метрики latency, queue depth, error rate и health check баз описаны в [plans/gpt_agents/stage5.md:29-36](plans/gpt_agents/stage5.md:29-36); использовать Prometheus + Alertmanager с экспортами из backend-функций.
- CI/CD и testing должны соответствовать плану: lint/pytest/vitest, Playwright E2E и регулярные load-тесты (Locust 1000 RPS `track-visit`, 50 RPS `bot-logger`).

## Обновления компонентов
### `track-visit`
- Опираясь на рекомендации [plans/recommendations/track-visit.md:17-81](plans/recommendations/track-visit.md:17-81) реализовать rate limiting (например, Redis token bucket) и DDoS-фильтрацию (анализ spike pattern по IP/UA).
- Перевести запись в `daily_stats` и `site_visits` на асинхронную очередь (RabbitMQ/Redis Streams) с batch insert и connection pooling для уменьшения latency.
- Кэшировать результаты device/browser parsing и re-use UTM/referrer/traffic source разбора; логику вынести в отдельный модуль для unit-тестов.
- Уточнить front-end скрипты metric beacons: подтверждать наличие human interaction, проверять `OwnStatsTab` authorization, и не отправлять логирование при подозрительной активности (CAPTCHA/JS challenge).

### `get-analytics`
- Следовать указаниям [plans/recommendations/get-analytics.md:17-88](plans/recommendations/get-analytics.md:17-88): добавить JWT/OAuth аутентификацию, валидировать диапазон дат ≤ 365 дней и использовать параметризованные запросы/ORM (исключить f-строки).
- Добавить connection pooling, Redis-кэш (с TTL 60–120 сек) и materialized views для топ-агрегаций с индексами по `visit_date`, `page_path`, `device_type`, `browser`.
- Поддерживать пагинацию (limit/offset), фильтры по датам и дополнительные метрики (conversions, bounce rate) при необходимости; логировать медленные запросы и трекать error rate.

### `bot-logger` и `bot-stats`
- Реализовать auth + CSRF protection; разрешать логирование только из проверенных источников (API-ключ, mutual TLS) согласно [plans/recommendations/bot-logger.md:16-72](plans/recommendations/bot-logger.md:16-72).
- Перейти на connection pooling, batch insert и проверенные prepared statements/ORM для защиты от SQL-инъекций, классифицировать ботов (good/bad/unknown) и экспортировать логи (CSV/JSON).
- `bot-stats` должен соблюдать ограничения limit ≤ 100, rate limiting, Redis-кэш, materialized views по `created_at/is_blocked`, pagination, фильтры по типу бота и IP-маскирование при экспорте для безопасности ([plans/recommendations/bot-stats.md:14-70](plans/recommendations/bot-stats.md:14-70)).

### Инфраструктура и мониторинг
- Добавить Prometheus-метрики latency и queue depth из [plans/gpt_agents/stage5.md:29-36](plans/gpt_agents/stage5.md:29-36), alert при error rate > 2% и health check БД (`scripts/health-check.sh`).
- Мониторить rate limiting, логировать аномалии, маскировать IP в логах и экспортировать статистику на dashboard и Slack/Email согласно CI plan-of-record.

## Тестирование и валидация
- Backend: unit-тесты модуля device/browser (track-visit), integration-тесты трекинга+логов, Playwright/pytest E2E цепочки track → analytics → bot detection, load-тесты Locust с 1000 RPS `track-visit` и 50 RPS `bot-logger`.
- Frontend: эмуляция 1000 визитов, проверка JS metric beacons и защит, `OwnStatsTab` отображает только авторизованные данные, rate limiting UI и предупреждения об ошибках метрик.
- Добавить мониторинговые проверки health check БД, rate limit alerts и логирование невалидного трафика (CAPTCHA, known bot signatures).
