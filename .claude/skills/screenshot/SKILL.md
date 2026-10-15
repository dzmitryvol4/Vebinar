---
name: screenshot
description: Take desktop and mobile screenshots of a page and look at them. Use to check layout visually or to compare against a design mockup.
argument-hint: [путь страницы, по умолчанию /]
---

1. Проверь, запущен ли dev-сервер (`curl -s -o /dev/null -w '%{http_code}' http://localhost:5173`). Если нет — запусти `npm run dev` в фоне.
2. Выполни `npm run screenshot -- ${ARGUMENTS:-/}`. Файлы появятся в `.screenshots/`.
3. Открой оба PNG через Read и оцени результат. Если есть макет от пользователя — сравни с ним и перечисли расхождения.
4. Итерируй: правка → скриншот → сравнение, пока результат не совпадёт с ожидаемым (обычно 2–3 итерации).
