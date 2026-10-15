---
name: plan
description: Explore the codebase and write an implementation plan for a site feature before writing any code. Use for any change bigger than a small tweak.
argument-hint: <что нужно сделать>
---

Задача: $ARGUMENTS

Работай по циклу «исследуй → спланируй», код пока НЕ пиши.

1. Прочитай файлы, которых касается задача (HTML-страницы, `src/styles/`, `src/scripts/`). Отметь, что уже есть и что можно переиспользовать (токены, классы, компоненты).
2. Если в задаче есть неоднозначности (тексты, дизайн, поведение на мобильных) — задай вопросы до плана.
3. Запиши план в `docs/plans/<YYYY-MM-DD>-<slug>.md`:
   - Цель и критерии готовности (что пользователь увидит / что проверит тест).
   - Какие файлы создаются и меняются.
   - Шаги реализации.
   - Как проверим: тесты в `tests/`, скриншоты desktop/mobile.
4. Покажи план кратко и дождись подтверждения.
