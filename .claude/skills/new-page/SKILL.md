---
name: new-page
description: Create a new page of the site with the shared header/footer, styles and a smoke test.
argument-hint: <имя-страницы> [назначение]
---

Создай страницу: $ARGUMENTS

1. Создай `<имя>.html` в корне проекта, взяв за основу структуру `index.html` (тот же `<head>`, шапка, подвал, `lang="ru"`, свой `<title>` и `meta description`). Vite сам подхватит файл как новую страницу.
2. Стили страницы — в `src/styles/pages/<имя>.css`, подключи их через `@import` в `src/styles/main.css`. Используй только токены из `tokens.css`.
3. Добавь ссылку на страницу в навигацию на всех страницах.
4. Добавь тест в `tests/`: страница открывается, есть `h1`, нет ошибок в консоли.
5. Запусти скилл `verify`.
