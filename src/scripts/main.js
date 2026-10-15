import { initLine } from './line.js';
import { renderProject } from './project.js';

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

const page = document.body.dataset.page;
if (page === 'home') initLine(document.querySelector('[data-line]'));
if (page === 'project') renderProject(document.querySelector('[data-project]'));
