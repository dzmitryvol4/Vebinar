import { test, expect } from '@playwright/test';

test('tab follows the section in view', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tabs__tab[href="#top"]')).toHaveAttribute('aria-current', 'true');

  await page.locator('.tabs__tab[href="#mellow"]').click();
  await expect(page.locator('.tabs__tab[href="#mellow"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.tabs__tab[aria-current="true"]')).toHaveCount(1);
});

test('every work image loads', async ({ page }) => {
  await page.goto('/');
  for (const img of await page.locator('.work__image').all()) {
    await img.scrollIntoViewIfNeeded();
    expect(await img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
});
