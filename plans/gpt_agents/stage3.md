# GPT-агент: Этап 3 — Разработка плана по CI/CD и тестированию

## Цель
Сформировать последовательный CI/CD-процесс, в котором отражены критичные API и рекомендации из [`plans/project_analysis.md`](plans/project_analysis.md:1) и [`plans/gpt_agents/stage2.md`](plans/gpt_agents/stage2.md:1), с отдельными этапами для unit, integration, E2E и нагрузочного тестирования, а также checkpoints и уведомления для контроля стабильности сервиса.

## Инструментарий и конфигурации
1. **Lint (Front + Back)** — ESLint/`eslint.config.js` и Flake8/`backend/.flake8` (или аналог) для `src/` и `backend/`
   - Frontend: `npm run lint` использует ESLint + TypeScript rules, добавленные через `eslint.config.js`.
   - Backend: `flake8 backend/` с конфигом, учитывающим игнорирование auto-generated, и `mypy` для проверки типов `backend/*.py`.
2. **Unit & Integration (Python)** — `pytest` с модулем `backend/tests.json` каждого сервиса, дополняется фикстурами для Postgres/Redis/Telegram, конфигурация в `pytest.ini`:
   - Разделение по меткам `unit`, `integration`. `integration` запускает контейнер `postgres` и мимик `telegram`/`bitrix24` через `requests-mock`.
3. **Unit (Frontend)** — `vitest` (или `jest` с `@testing-library/react`) для `src/components`, `src/pages`. Конфиг: `vitest.config.ts` с `setupFiles` и `coverage`.
4. **E2E** — Playwright с конфигом `playwright.config.ts`, запускающий сценарии: форма `submit-order`, админские операции `auth-admin`, интеграция с Bitrix24/Telegram по цепочке, покрывающие потоки из `plans/project_analysis.md:13-17`.
5. **Нагрузочное** — Locust с `locustfile.py`, имитирующим 50–100 rps для `track-visit`, `bot-logger`, `submit-order`. Конфиг включает пользовательские лимиты latency и failure thresholds.
6. **Deploy** — GitHub Actions/Runners (Linux) + `scripts/quick-deploy.sh` для фронта и `deploy.sh` для бэка.

## Pipeline-стадии и условия

| Стадия | Триггер | Действия | Условия завершения |
| --- | --- | --- | --- |
| **lint** | pull_request | `npm run lint`, `flake8 backend/` | Все ошибки отсутствуют, отчёт о предупреждениях сохраняется
| **unit (backend)** | pull_request | `pytest -m unit` | Покрытие критичных UUID ≥ 80%, фикстуры доступа к БД/Telegram мокируются
| **unit (frontend)** | pull_request | `vitest run --runInBand` (или `npm run test:unit`) | Zero failed tests, coverage report
| **integration** | pull_request | `pytest -m integration` с запущенными `postgres`, `mock API` | Все внешние API эмулированы, network timeouts < 1s
| **e2e** | merge в `main` / scheduled (ночная) | Playwright, выполняющий сценарии `contact-form`, `auth-admin`, `submit-order` | Успешный проход цепочек; снимок страницы и видео сохраняются
| **load** | merge в `main` / отдельный manual trigger | Locust-скрипт на `track-visit`, `bot-logger`, `submit-order` | Средняя latency < 400ms, без всплесков ошибок >2%
| **deploy** | merge в `main` после всех тестов | `scripts/quick-deploy.sh`, `deploy.sh`, `deploy_nginx.sh` | Все сервисы отвечают health-check из `scripts/health-check.sh`

## Триггеры и разделение сценариев
- **Pull Request**: lint → unit (back/front) → integration. Блокирующие проверки в PR должны пройти прежде, чем разрешено слияние.
- **Merge в main**: выполняется полный pipeline (lint+unit+integration → e2e → load → deploy). Если load не проходит, оповещение блокирует deploy.
- **Scheduled (ночные)**: повторный запуск integration/E2E/нагрузки для мониторинга и детектирования регрессий (в идеале `weekly` для load, `daily` для integration).

## Checkpoints и мониторинг
1. **Coverage Gate** — после unit и integration сверять coverage report; если ниже целевого уровня (backend ≥ 80%, frontend ≥ 75%), отправлять в Slack `#ci-alerts`.
2. **Health Check** — перед deploy запускать `scripts/health-check.sh` и сравнивать с метриками latency/availability из `plans/project_analysis.md:17`. Автоматически отклонять deploy при 5xx > 0.
3. **Integration Checkpoint** — при запуске интеграционных тестов проверять `api/uuid` маршруты и возможность проксирования (`proxyToGatevey`).
4. **Load Checkpoint** — сравнение ошибок/latency с базовыми значениями, записанными в Prometheus (или простой `scripts/verify-deployment.sh`). Результат публикуется в Slack + email.
5. **E2E Checkpoint** — использование Playwright-отчёта + видеозаписи; при падении сохранять лог и отменять релиз.

## Уведомления
- Slack `#ci-alerts`: каждый этап отправляет summary (status/passed/failed). При критических сбоях (load/E2E/deploy) — `@devops` + `@backend-team`.
- Email (integration/load): автоматическая рассылка через GitHub Action `actions/notify` — `dev-team@company.ru` + `ops@company.ru`.
- В случае deploy — webhook в `monitoring` канал с результатом `scripts/health-check` и ссылкой на артефакты.

## Дополнительно
- Хранить артефакты `pytest` и `playwright` в `./reports/ci/` для последующего анализа.
- `locust` результаты публикуются как `CSV`/`JSON` и архивируются в `artifacts/load/`.
- Дорожная карта обновляется при изменении `plans/recommendations/*.md` с ссылкой на новые критические сервисы.

План обеспечивает видимость для всех критичных UUID (см. [`plans/gpt_agents/stage2.md`](plans/gpt_agents/stage2.md:1)) и учитывает требования из [`plans/project_analysis.md`](plans/project_analysis.md:1).
