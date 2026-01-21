# План действий по улучшению `consent`, `contact-form`, `submit-order`

## Цель
Обеспечить защиту от ботов/спама и унифицированную обработку/логирование + frontend-статусы согласно [`docs/debag/02_user-consent-contact.md:1-16`](docs/debag/02_user-consent-contact.md:1-16).

## Шаги реализации
1. **Backend shared utilities**
   - Создать helper `backend/_shared/security.py` с: whitelist origin (регулярки), rate limiting на Redis, HTML-сантайзинг, regex-валидацией email/phone и проверкой honeypot.
   - Добавить helper `backend/_shared/logging.py` (или расширить существующий) для расчёта `request_id`, `ip`, `status`, `error`.
2. **Contact form (`backend/contact-form/index.py`)**
   - Использовать shared utilities для origin/check, validation, rate limit (5/min per IP), honeypot и sanitize.
   - Обновить ответ с `status` + подробной ошибкой, логировать ошибки/результаты.
   - Добавить retry-обёртку для Telegram (например, 3 попытки с `urllib.request.urlopen`), запуск асинхронно через `threading.Thread` либо очередь (queue table/Redis).
3. **Submit order (`backend/submit-order/index.py`)**
   - Аналогичные проверки и логика, дополнительные поля (services, total). Добавить `botField` для honeypot, origin whitelist, validation/sanitize.
4. **Consent (`backend/consent/index.py`)**
   - Добавить историю хранения (таблица `user_consents_history`), сохранить email/phone проверенные и sanitized.
   - Отправка Telegram через retry/экспоненциальный backoff (3 попытки, через helper).
   - Общая обработка ошибок и логирование при каждом шаге.
5. **Frontend (`src/components/...`, `ContactModal`, `Contacts`, `CalcModal` + `OrderModal`)**
   - Вставить скрытое поле honeypot `botField`, отправлять `origin`, `timestamp`, `captcha` (можно mock). Показывать UI-статусы (`loading`, `success`, `error`) и сообщения toast.
   - Добавить статусы для `CalcModal`/`OrderModal`: disable button при отправке, отображение ошибок/успеха, включить `toast` и `Icon`.
6. **Тесты и документация**
   - Расширить `backend/*/tests.json` + unit тесты (`pytests`) проверяют rate limiting, validation, retry, logging.
   - Добавить frontend Playwright тесты в `tests/e2e` (если есть) или сценарии `playwright.config.ts`.
   - Обновить документацию или `docs/debag/02_user-consent-contact.md` со статусами.
7. - Проблемы со сборкой build проекта с ошибкой - Выполнение задачи: npm run build 


> vite-react-shadcn-ts@0.0.0 build
> tsc && vite build

src/components/Contacts.tsx:150:20 - error TS6133: 'setHoneypot' is declared but its value is never read.

150   const [honeypot, setHoneypot] = useState('');
                       ~~~~~~~~~~~


Found 1 error in src/components/Contacts.tsx:150

## Следующие шаги
- Подготовить новый файл `backend/_shared/security.py` и интегрировать его в функции.
- Добавить/обновить тесты согласно плану (unit, integration, E2E).
- Проверить, что CI (Flake8/mypy/npm run lint) проходит после изменений.
