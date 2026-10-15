import { test, expect } from '@playwright/test';
import { projects, categories } from '../src/data/projects.js';

test('line shows thumbnails of every project and loops', async ({ page }) => {
  await page.goto('/');
  for (const p of projects) {
    await expect(page.locator(`.line__thumb[data-project="${p.id}"]`).first()).toBeAttached();
  }
  const km = Number(await page.locator('[data-km]').textContent());
  expect(km).toBeGreaterThanOrEqual(0);
  expect(km).toBeLessThan(675);
});

test('category buttons filter the line', async ({ page }) => {
  await page.goto('/');
  const ids = (sel) =>
    page.locator(sel).evaluateAll((els) => [...new Set(els.map((el) => el.dataset.project))]);

  await expect(page.locator('.filters__button')).toHaveText([
    'Айдентика и брендинг',
    'Упаковка',
    'Книжные издания',
    'Все проекты',
  ]);
  await expect(page.getByRole('button', { name: 'Все проекты' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Айдентика и брендинг' }).click();
  expect(await ids('.line__thumb')).toEqual(['linen']);
  await expect(page).toHaveURL(/\?c=identity/);

  await page.getByRole('button', { name: 'Упаковка' }).click();
  expect(await ids('.line__thumb')).toEqual(['mellow']);

  await page.getByRole('button', { name: 'Все проекты' }).click();
  expect((await ids('.line__thumb')).sort()).toEqual(projects.map((p) => p.id).sort());
  await expect(page).not.toHaveURL(/\?c=/);
});

test('category from the link is applied on load', async ({ page }) => {
  await page.goto('/?c=books');
  await expect(page.getByRole('button', { name: 'Книжные издания' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const shown = await page
    .locator('.line__thumb')
    .evaluateAll((els) => [...new Set(els.map((el) => el.dataset.project))]);
  expect(shown).toEqual(['len']);
});

test('thumbnail is reachable by keyboard and opens the project', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard navigation is a desktop scenario');
  await page.goto('/');
  const first = page.locator('.line__thumb[aria-label]').first();
  await first.focus();
  await expect(first).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/project\.html\?p=/);
});

test('every project has a known category', async () => {
  for (const p of projects) expect(categories.map((c) => c.id)).toContain(p.category);
});

test('hovering a thumbnail spills out its project images', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no hover on touch screens');
  await page.goto('/');
  const thumb = page.locator('.line__thumb[data-project="linen"]').first();
  const box = await page.locator('[data-line]').boundingBox();
  // Bring the first Linen thumb under the pointer by hovering wherever it currently is.
  const t = await thumb.boundingBox();
  test.skip(!t || t.x < 0 || t.x > box.width, 'thumbnail is off screen');
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
  const linen = projects.find((p) => p.id === 'linen');
  await expect(page.locator('.spill__image')).toHaveCount(linen.images.length);
});

test('every project page shows its images and links to the next one', async ({ page }) => {
  for (const [i, p] of projects.entries()) {
    await page.goto(`/project.html?p=${p.id}`);
    await expect(page.locator('h1')).toHaveText(p.title);
    await expect(page.locator('.project__images img')).toHaveCount(p.images.length);
    const next = projects[(i + 1) % projects.length];
    await expect(page.locator('.project__next a')).toHaveText(next.title);
    await expect(page.locator(`.project__kind a[href="/?c=${p.category}"]`)).toBeVisible();
  }
});

test('unknown project shows a way back', async ({ page }) => {
  await page.goto('/project.html?p=nope');
  await expect(page.locator('h1')).toHaveText('Такого проекта нет');
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});

test('about page has contacts', async ({ page }) => {
  await page.goto('/about.html');
  await expect(page.locator('a[href="mailto:minchenokwork@gmail.com"]')).toBeVisible();
  await expect(page.locator('a[href="https://t.me/kateminsk"]')).toBeVisible();
});
