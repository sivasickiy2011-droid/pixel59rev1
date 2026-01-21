# Промпт: UI/CRUD stability (portfolio, news-admin, news-feed, services-admin)

## Контекст
- Фронтенд зависит от шейд-UI и компонентов `Portfolio`, `News`, `Services` (см. `src/components` и `plans/gpt_agents/stage5.md:21-37`).
- Приоритеты: безопасность CRUD, фильтры, пагинацию, валидацию изображений, индексы по `display_order`, `is_active`, `published_date` и `news rankings`.
- Учитывай рекомендации (`plans/recommendations/*` для portfolio, news-admin, news-feed, services-admin) и план тестирования (unit, integration, E2E, нагрузка).

## Основные задачи
1. Добавить аутентификацию/аудит и rate limiting для всех CRUD (portfolio, news-admin, services-admin) + валидацию изображений и фильтрацию данных.
2. Обновить news-feed: добавить индексы, пагинацию, фильтры, поиск, CDN для изображений и механизм related news + кеш Redis.
3. Подключить materialized views и lazy loading для `portfolio` и `services`, увеличить coverage unit-тестов сортировки и отображения.
4. Обеспечить frontend: карусели/фильтры в `Portfolio` и `News` обновляются без ошибок, пагинация корректно отображает данные, а при ошибках CRUD показываются дружелюбные сообщения.

## Тестирование
- Backend: unit-тесты CRUD, integration-тесты фильтрации/поиска, E2E Playwright на админских панелях, нагрузочное тестирование 100 операций в минуту.
- Frontend: end-to-end (Vitest/Playwright) сценарии: загрузка новостей, фильтры по категориям, загрузка изображений (WebP + CDN), проверка related news и пагинации.
