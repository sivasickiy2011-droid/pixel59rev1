# Промпт: Надёжный consent + contact-form, submit-order

## Контекст
- Основной фокус на защите от спама/ботов и валидации данных для внешних форм (`plans/recommendations/consent.md:16-77`, `plans/recommendations/contact-form.md:17-88`, `plans/recommendations/submit-order.md:17-88`).
- CI/CD и load тесты из [plans/gpt_agents/stage5.md:38-45](plans/gpt_agents/stage5.md:38-45).
- Важно обеспечить frontend-взаимодействие: контактная форма и калькулятор заявок на сайте должны отвечать ожидаемой безопасности.

## Основные задачи
1. Ввести rate limiting, honeypot/captcha, whitelist origin и validation email/phone для contact-form и submit-order с ограничением на 5 заявок/мин и защитой от HTML-инъекций.
2. Для consent добавить хранение истории, проверку email/phone, асинхронную отправку Telegram и retry logic, чтобы при недоступности API данные не терялись.
3. Унифицировать обработку ошибок и логирование для всех трёх функций (включая retry) и обеспечить обновление UI статуса отправки (loading, success, error с описанием).
4. Сформировать frontend-тесты: заполнение форм (contact, submit), проверка капчи, honeypot, отображения ошибок валидации и recovery при тайм-ауте Telegram.

## Тестирование
- Backend: unit-тесты валидации/обработки, integration-тесты отправки/логирования, E2E для конвейера обратной связи (form → Bitrix24/Telegram). Нагрузочное: 50 заявок в минуту, 100 согласий в минуту.
- Frontend: автоматизированные сценарии Playwright/Playwright CHECKER для всех форм (включая retry), проверка mask/alerts статуса и UI rate limiting при >5 запросов в минуту.
