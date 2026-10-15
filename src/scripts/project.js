import { projects, findProject } from '../data/projects.js';

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

export function renderProject(root) {
  const id = new URLSearchParams(location.search).get('p');
  const project = findProject(id);

  if (!project) {
    document.title = 'Проект не найден — 675 agency';
    root.append(
      el('h1', { className: 'project__title', textContent: 'Такого проекта нет' }),
      el('p', {}, ['Все работы — ', el('a', { href: '/', textContent: 'на главной' }), '.']),
    );
    return;
  }

  document.title = `${project.title} — 675 agency`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', `${project.kind}: ${project.title}. ${project.description[0]}`);

  const next = projects[(projects.indexOf(project) + 1) % projects.length];

  root.append(
    el('div', { className: 'project__head' }, [
      el('h1', { className: 'project__title', textContent: project.title }),
      el('p', { className: 'project__kind', textContent: project.kind }),
      el(
        'div',
        { className: 'project__text' },
        project.description.map((text) => el('p', { textContent: text })),
      ),
    ]),
    el(
      'div',
      { className: 'project__images' },
      project.images.map((img, i) =>
        el('img', {
          src: img.src,
          width: img.width,
          height: img.height,
          alt: img.alt,
          loading: i === 0 ? 'eager' : 'lazy',
          className: img.height > img.width ? 'is-portrait' : '',
        }),
      ),
    ),
    // The line has no end: after the last project comes the first one again.
    el('nav', { className: 'project__next', ariaLabel: 'Следующий проект' }, [
      el('span', { className: 'project__next-label', textContent: 'Дальше по линии' }),
      el('a', { href: `/project.html?p=${next.id}`, textContent: next.title }),
    ]),
  );
}
