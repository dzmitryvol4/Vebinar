import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import { defineConfig } from 'vite';

// Every *.html file in the project root becomes a page (multi-page site).
const pages = Object.fromEntries(
  readdirSync(import.meta.dirname)
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f.replace(/\.html$/, ''), resolve(import.meta.dirname, f)]),
);

export default defineConfig({
  server: { port: 5173, strictPort: true, host: true },
  build: { rollupOptions: { input: pages } },
});
