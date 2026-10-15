---
name: verify
description: Run the full check (lint, build, Playwright tests) and visually check pages via screenshots. Use after finishing any change and before committing.
---

1. Запусти `npm run check` (eslint + prettier, сборка, Playwright-тесты на desktop и mobile).
2. При ошибках — исправь причину, а не тест, и запусти снова.
3. Для изменённых страниц сделай скриншоты (скилл `screenshot`) и посмотри на них: вёрстка, отступы, переполнение на мобильном, тёмная тема.
4. Отчитайся коротко: что прошло, что исправлено, что осталось. Не утверждай, что всё работает, если какая-то проверка не запускалась.
