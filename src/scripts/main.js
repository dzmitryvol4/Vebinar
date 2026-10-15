import { initTabs } from './tabs.js';

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

initTabs();
