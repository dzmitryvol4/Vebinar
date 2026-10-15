// Usage: npm run screenshot -- [path=/] [url=http://localhost:5173]
// Saves desktop and mobile screenshots to .screenshots/ so changes can be checked visually.
import { mkdirSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';

const path = process.argv[2] ?? '/';
const base = process.argv[3] ?? 'http://localhost:5173';
const slug = path.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
mkdirSync('.screenshots', { recursive: true });

const browser = await chromium.launch();
for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', devices['Pixel 7']],
]) {
  const page = await (await browser.newContext(opts)).newPage();
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
  const file = `.screenshots/${slug}-${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
}
await browser.close();
