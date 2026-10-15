import { projects, categories, findCategory } from '../data/projects.js';

const KM = 675;
const DRIFT = 18; // px per second: the line keeps moving slowly on its own
const EASE = 0.12;
const DRAG_THRESHOLD = 6;
const ALL = 'all';

const mod = (n, m) => ((n % m) + m) % m;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover)');

const projectUrl = (id) => `/project.html?p=${id}`;

// One run of the sequence. Only the first copy is reachable by keyboard and screen readers;
// the rest repeat it to make the line endless.
function buildCopy(list, primary) {
  const copy = document.createElement('div');
  copy.className = 'line__copy';
  if (!primary) copy.setAttribute('aria-hidden', 'true');
  for (const project of list) {
    const group = document.createElement('div');
    group.className = 'line__group';
    project.images.forEach((img, i) => {
      const link = document.createElement('a');
      link.className = 'line__thumb';
      link.href = projectUrl(project.id);
      link.dataset.project = project.id;
      // One tab stop per project: its first thumbnail.
      if (primary && i === 0) {
        link.setAttribute(
          'aria-label',
          `${project.title}, ${findCategory(project.category).title}`,
        );
      } else {
        link.tabIndex = -1;
        if (primary) link.setAttribute('aria-hidden', 'true');
      }
      const thumb = new Image(img.width, img.height);
      thumb.src = img.thumb;
      thumb.alt = '';
      thumb.draggable = false;
      link.append(thumb);
      group.append(link);
    });
    copy.append(group);
  }
  return copy;
}

// Buttons for the categories that have projects, plus «Все проекты».
function buildFilters(list) {
  const used = categories.filter((c) => projects.some((p) => p.category === c.id));
  for (const { id, title } of [...used, { id: ALL, title: 'Все проекты' }]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filters__button';
    button.dataset.category = id;
    button.textContent = title;
    const item = document.createElement('li');
    item.append(button);
    list.append(item);
  }
}

// Places the project's images in two rows, above and below the line, around anchorX.
function layoutSpill(project, anchorX, box, spillHeight, clearance) {
  const gap = 16;
  const lineY = box.height / 2;
  const rows = [[], []];
  project.images.forEach((img, i) => rows[i % 2].push(img));
  const stagger = [0, -14, 10, -6, 12];

  return rows.flatMap((row, r) => {
    const widths = row.map((img) => (img.width / img.height) * spillHeight);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (row.length - 1);
    let x = Math.min(Math.max(anchorX - total / 2, gap), Math.max(gap, box.width - total - gap));
    return row.map((img, i) => {
      const width = widths[i];
      const y =
        r === 0
          ? lineY - clearance - spillHeight - Math.abs(stagger[i % 5])
          : lineY + clearance + Math.abs(stagger[(i + 2) % 5]);
      const placed = { img, x, y, width };
      x += width + gap;
      return placed;
    });
  });
}

export function initLine(line) {
  const track = line.querySelector('[data-track]');
  const spill = line.querySelector('[data-spill]');
  const filters = document.querySelector('[data-filters]');
  const km = document.querySelector('[data-km]');
  const hint = document.querySelector('[data-hint]');

  buildFilters(filters);
  if (hint && !canHover.matches) hint.lastChild.textContent = 'Тяните линию';

  const fromUrl = new URLSearchParams(location.search).get('c');
  let category = filters.querySelector(`[data-category="${fromUrl}"]`) ? fromUrl : ALL;
  let cycle = 0;
  let pos = 0;
  let target = 0;
  let active = null;
  let last = performance.now();
  let drag = null;
  let suppressClick = false;

  const visibleProjects = () =>
    category === ALL ? projects : projects.filter((p) => p.category === category);

  // Enough copies of the sequence to cover the screen at any offset.
  const render = () => {
    const list = visibleProjects();
    track.replaceChildren(buildCopy(list, true));
    cycle = track.firstElementChild.getBoundingClientRect().width;
    const copies = Math.ceil(line.clientWidth / cycle) + 1;
    for (let i = 1; i < copies; i++) track.append(buildCopy(list, false));
  };

  const hideHint = () => hint?.classList.add('is-hidden');

  const close = () => {
    active = null;
    line.classList.remove('has-active');
    spill.classList.remove('is-open');
    track.querySelectorAll('.is-active').forEach((t) => t.classList.remove('is-active'));
  };

  const open = (id, anchorX) => {
    if (active === id) return;
    const project = projects.find((p) => p.id === id);
    active = id;
    line.classList.add('has-active');
    track.querySelectorAll('.line__thumb').forEach((t) => {
      t.classList.toggle('is-active', t.dataset.project === id);
    });

    const box = line.getBoundingClientRect();
    // --spill-height is a clamp() with vh, so measure it instead of parsing.
    const probe = document.createElement('div');
    probe.style.height = 'var(--spill-height)';
    spill.append(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    const thumbHeight = track.querySelector('img')?.getBoundingClientRect().height ?? 0;

    spill.classList.remove('is-open');
    spill.replaceChildren(
      ...layoutSpill(project, anchorX, box, height, thumbHeight / 2 + 16).map(
        ({ img, x, y, width }, i) => {
          const image = new Image(img.width, img.height);
          image.src = img.src;
          image.alt = '';
          image.className = 'spill__image';
          image.style.left = `${x}px`;
          image.style.top = `${y}px`;
          // Each image starts from the anchor point on the line.
          image.style.setProperty('--from-x', `${anchorX - x - width / 2}px`);
          image.style.setProperty('--from-y', `${box.height / 2 - y - height / 2}px`);
          image.style.setProperty('--delay', `${i * 35}ms`);
          return image;
        },
      ),
    );
    requestAnimationFrame(() => requestAnimationFrame(() => spill.classList.add('is-open')));
  };

  const thumbCenter = (thumb) => {
    const box = line.getBoundingClientRect();
    const r = thumb.getBoundingClientRect();
    return r.left + r.width / 2 - box.left;
  };

  const apply = () => {
    const offset = mod(pos, cycle);
    track.style.transform = `translateX(${-offset}px)`;
    km.textContent = String(Math.floor((offset / cycle) * KM));
  };

  const tick = (now) => {
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (!active && !drag && !reducedMotion.matches) target += DRIFT * dt;
    pos += (target - pos) * (reducedMotion.matches ? 1 : EASE);
    apply();
    requestAnimationFrame(tick);
  };

  const setCategory = (id) => {
    category = id;
    filters.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.category === id));
    });
    const url = new URL(location.href);
    if (id === ALL) url.searchParams.delete('c');
    else url.searchParams.set('c', id);
    history.replaceState(null, '', url);
    close();
    render();
    // The filtered line starts from its first project.
    pos = target = 0;
    apply();
    track.classList.remove('is-entering');
    void track.offsetWidth;
    track.classList.add('is-entering');
  };

  filters.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-category]');
    if (button && button.dataset.category !== category) setCategory(button.dataset.category);
  });

  line.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      target += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      close();
      hideHint();
    },
    { passive: false },
  );

  line.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, start: target, moved: false };
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      drag.moved = true;
      line.classList.add('is-dragging');
      close();
      hideHint();
    }
    if (drag.moved) pos = target = drag.start - dx;
  });

  window.addEventListener('pointerup', () => {
    if (!drag) return;
    suppressClick = drag.moved;
    drag = null;
    line.classList.remove('is-dragging');
  });

  // A drag should not open the project under the pointer.
  line.addEventListener('click', (e) => {
    if (suppressClick) e.preventDefault();
    suppressClick = false;
  });

  track.addEventListener('pointerover', (e) => {
    const thumb = e.target.closest('.line__thumb');
    if (!thumb || drag || !canHover.matches || e.pointerType !== 'mouse') return;
    open(thumb.dataset.project, thumbCenter(thumb));
  });
  track.addEventListener('pointerleave', close);

  // Keyboard: bring the focused thumbnail into view (it is in the first copy,
  // so an offset between 0 and one cycle always shows it), then spill its project.
  track.addEventListener('focusin', (e) => {
    const thumb = e.target.closest('.line__thumb');
    if (!thumb) return;
    const x = thumb.offsetLeft + thumb.offsetWidth / 2;
    const offset = Math.min(Math.max(x - line.clientWidth / 2, 0), cycle - 1);
    pos = target = pos - mod(pos, cycle) + offset;
    apply();
    active = null;
    open(thumb.dataset.project, thumbCenter(thumb));
    hideHint();
  });
  track.addEventListener('focusout', (e) => {
    if (!track.contains(e.relatedTarget)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('.line__thumb')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      target += e.key === 'ArrowRight' ? 240 : -240;
      close();
      hideHint();
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      close();
      render();
    }, 150);
  });

  setCategory(category);
  requestAnimationFrame(tick);
}
