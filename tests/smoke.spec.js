import { test, expect } from '@playwright/test';

const pages = ['/', '/about.html', '/project.html?p=len'];

for (const path of pages) {
  test(`${path} renders without console errors or horizontal scroll`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/675 agency/);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}
