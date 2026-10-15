import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'test-results/', 'playwright-report/', '.screenshots/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.js', 'scripts/**/*.mjs', '.claude/hooks/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // Playwright tests run in Node, but page.evaluate() callbacks run in the browser.
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
