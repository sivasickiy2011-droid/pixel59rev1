# GPT-агент: Этап 4 — Подготовка миграций и мониторинга

## Цель
Определить необходимые DB/инфраструктурные миграции и системы мониторинга (alerts, dashboards) для устойчивости проекта.

## Подзадачи
1. Проанализировать таблицы (`site_visits`, `daily_stats`, `bot_logs`, `services`, `secure_settings`, `news`, `portfolio` и пр.) и выявить нужные миграции (индексы, partitioning).
2. Сформулировать требования к мониторингу метрик из ранее описанных рекомендаций.
3. Предложить план миграций и метрик в формате CSV/Markdown.

## Промпт для агента
"Ты GPT-агент. Собери список таблиц из `backend/*.py` и определи миграции: индексы, partitioning, constraint-ы, которые гарантируют производительность. Также зафиксируй, какие метрики (rate, latencies, errors, queue depth, database connections) необходимо отслеживать. Предоставь всё в виде таблиц.

## Ожидаемый результат
- Таблица миграций с полями (таблица, индекс/constraint, обоснование)
- Таблица метрик (источник, тип, threshold/alert)
- Подготовка к этапу 5

## План миграций
| Таблица | Индекс / constraint / partitioning | Обоснование |
| --- | --- | --- |
| `site_visits` | `idx_site_visits_visit_date` (visit_date DESC), `idx_site_visits_page_path`, частичный индекс `idx_site_visits_non_admin` на `is_admin = FALSE`, диапазон и/или месечные партиции по `visit_date` | Основные агрегаты (`track-visit`, `get-analytics`) отфильтровывают по дате и `is_admin`; partitioning уменьшит объем сканируемых данных и ускорит GC.
| `daily_stats` | `UNIQUE (stat_date)`, `idx_daily_stats_stat_date`, добавление `stat_date` partitioning по году/месяцу | Каждодневные апдейты нуждаются в защите от дублирования и быстром истечении выборок за диапазоны.
| `bot_logs` | `idx_bot_logs_created_at DESC`, `idx_bot_logs_is_blocked`, range-partitioning по `created_at` (например, партиции на месяц) | Журнал растет быстро; текущие индексы для фильтрации времени и статуса — обязательны, партиции облегчают очистку s кворума и ускоряют агрегации (`bot-stats`).
| `secure_settings` | `idx_secure_settings_category`, `idx_secure_settings_key`, `UNIQUE (category, key)` | Частые запросы по ключу/категории требуют дешевых lookup-ов, constraint препятствует дублирующимся секретам.
| `services` | `idx_services_category`, `idx_services_is_active`, check constraint `price >= 0`, `UNIQUE (service_id)` (уже заключается в table definition) | Категории и флаги активности — фильтры для админ-панели и магазина; проверка цены предотвращает негативные значения и облегчает агрегации.
| `news` | `idx_news_is_active` (WHERE is_active TRUE), `idx_news_published_date`, `UNIQUE (link)`, предикатные индексы по `category`, `source` | `news-admin`/`news-feed` сортируют по дате и статусу, уникальный link защищает от дублей, индексы сокращают время выборки и перекладывают нагрузку с full scan.
| `portfolio` | `idx_portfolio_is_active`, `idx_portfolio_display_order`, `idx_portfolio_price`, `GENERATOR jsonb_path_ops` для `gallery_images`, если используется фильтрация, партиционирование по `is_active` или `display_order` | Админ-панель отображает активные и отсортированные проекты; индексы обеспечивают быстрые списки и поддержку каруселей.

## План мониторинга
| Источник | Тип | Threshold / Alert | Notes |
| --- | --- | --- | --- |
| `backend/track-visit` | Rate (кол-во POST) | > 1000 req/min → alert на DDoS/хвост spambot | Слежение за резкими всплесками и возможным перебором коннектов.
| `backend/track-visit` | Latency (P95 записи в БД) | > 500 ms → alert | Высокая латентность сигнализирует о долгих транзакциях или недоступности БД.
| `backend/track-visit` | Error rate (5xx/timeout) | > 1 % → alert | Хватит для реагирования на разрывы соединений, проблемы with pool.
| `daily_stats` async queue (планируемый) | Queue depth | > 5000 записей → alert | Рост очереди укажет на узкое место в агрегировании статистики.
| PostgreSQL (через pg_stat_activity) | Database connections | > 80 % от лимита → alert | Необходимо предусмотреть connection pooling и подсказки по миграциям.
| `backend/get-analytics` | Latency (P95) | > 1 s → alert | Медленные запросы влияют на UX аналитики и требуют индексов/materialized view.
| `backend/bot-logger` / `backend/bot-stats` | Error rate | > 2 % → alert | Аномалии в логах могут сигнализировать об изменении паттернов ботов/ошибок.
| `backend/secure-settings` | Change rate / anomalies | Неизвестные операции > 10 за минуту или невалидные ключи → alert | Отслеживание админских манипуляций.

## Подготовка к этапу 5
- Сверить архитектурную диаграмму, CI/CD и тесты согласно чеклистам [plans/gpt_agents/stage5.md](plans/gpt_agents/stage5.md:1).
- Собрать таблицы миграций/метрик в финальный отчёт, включив UUID и приоритеты из предыдущих этапов, а также план materialized views и dashboards.
- Подготовить prompt-набор для запуска агентов, опираясь на результаты этапов 1-4 и требования [plans/gpt_agents/stage5.md](plans/gpt_agents/stage5.md:12).
