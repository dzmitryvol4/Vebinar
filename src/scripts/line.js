import { projects } from '../data/projects.js';

const KM = 675;
const DRIFT = 18; // px per second: the line keeps moving slowly on its own
const EASE = 0.12;
const DRAG_THRESHOLD = 6;

const mod = (n, m) => ((n % m) + m) % m;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const canHover = matchMedia('(hover: hover)');

const projectUrl = (id) => `/project.html?p=${id}`;

function buildCopy() {
  const copy = document.createElement('div');
  copy.className = 'line__copy';
  for (const project of projects) {
    const group = document.createElement('div');
    group.className = 'line__group';
    for (const img of project.images) {
      const link = document.createElement('a');
      link.className = 'line__thumb';
      link.href = projectUrl(project.id);
      link.tabIndex = -1;
      link.dataset.project = project.id;
      const thumb = new Image(img.width, img.height);
      thumb.src = img.thumb;
      thumb.alt = '';
      thumb.draggable = false;
      link.append(thumb);
      group.append(link);
    }
    copy.append(group);
  }
  return copy;
}

function buildIndex(list) {
  for (const project of projects) {
    const link = document.createElement('a');
    link.href = projectUrl(project.id);
    link.dataset.project = project.id;
    link.append(`${project.title}, `);
    const kind = document.createElement('span');
    kind.className = 'index__kind';
    kind.textContent = project.kind.toLowerCase();
    link.append(kind);
    const item = document.createElement('li');
    item.append(link);
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
  const index = document.querySelector('[data-index]');
  const km = document.querySelector('[data-km]');
  const hint = document.querySelector('[data-hint]');

  buildIndex(index);
  if (hint && !canHover.matches) hint.lastChild.textContent = 'Тяните линию';

  let cycle = 0;
  let pos = 0;
  let target = 0;
  let active = null;
  let last = performance.now();
  let drag = null;
  let suppressClick = false;

  // Enough copies of the sequence to cover the screen at any offset.
  const render = () => {
    track.replaceChildren(buildCopy());
    cycle = track.firstElementChild.getBoundingClientRect().width;
    const copies = Math.ceil(line.clientWidth / cycle) + 1;
    for (let i = 1; i < copies; i++) track.append(buildCopy());
  };

  const hideHint = () => hint?.classList.add('is-hidden');

  const close = () => {
    active = null;
    line.classList.remove('has-active');
    spill.classList.remove('is-open');
    track.querySelectorAll('.is-active').forEach((t) => t.classList.remove('is-active'));
    index.querySelectorAll('.is-active').forEach((a) => a.classList.remove('is-active'));
  };

  const open = (id, anchorX) => {
    if (active === id) return;
    const project = projects.find((p) => p.id === id);
    active = id;
    line.classList.add('has-active');
    track.querySelectorAll('.line__thumb').forEach((t) => {
      t.classList.toggle('is-active', t.dataset.project === id);
    });
    index.querySelectorAll('a').forEach((a) => {
      a.classList.toggle('is-active', a.dataset.project === id);
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

  // Center of the visible thumb of a project that is closest to the screen center.
  const anchorFor = (id) => {
    const box = line.getBoundingClientRect();
    let best = box.width / 2;
    let bestDistance = Infinity;
    for (const t of track.querySelectorAll(`[data-project="${id}"]`)) {
      const r = t.getBoundingClientRect();
      const center = r.left + r.width / 2 - box.left;
      const distance = Math.abs(center - box.width / 2);
      if (distance < bestDistance) [best, bestDistance] = [center, distance];
    }
    return best;
  };

  const tick = (now) => {
    const dt = Math.min(now - last, 100) / 1000;
    last = now;
    if (!active && !drag && !reducedMotion.matches) target += DRIFT * dt;
    pos += (target - pos) * (reducedMotion.matches ? 1 : EASE);
    const offset = mod(pos, cycle);
    track.style.transform = `translateX(${-offset}px)`;
    km.textContent = String(Math.floor((offset / cycle) * KM));
    requestAnimationFrame(tick);
  };

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
    const box = line.getBoundingClientRect();
    const r = thumb.getBoundingClientRect();
    open(thumb.dataset.project, r.left + r.width / 2 - box.left);
  });
  track.addEventListener('pointerleave', close);

  const fromIndex = (e) => {
    const link = e.target.closest('a[data-project]');
    if (link) open(link.dataset.project, anchorFor(link.dataset.project));
  };
  index.addEventListener('pointerover', (e) => canHover.matches && fromIndex(e));
  index.addEventListener('focusin', fromIndex);
  index.addEventListener('pointerleave', close);
  index.addEventListener('focusout', (e) => {
    if (!index.contains(e.relatedTarget)) close();
  });

  document.addEventListener('keydown', (e) => {
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

  render();
  requestAnimationFrame(tick);
}
