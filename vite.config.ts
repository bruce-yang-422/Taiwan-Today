import { defineConfig } from 'vite';
import { readFileSync, readdirSync } from 'node:fs';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: 'newtab.html' } },
  plugins: [{ name: 'extension-manifest', generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'manifest.json', source: readFileSync('manifest.json', 'utf8') });
    for (const lang of readdirSync('_locales')) {
      this.emitFile({ type: 'asset', fileName: `_locales/${lang}/messages.json`, source: readFileSync(`_locales/${lang}/messages.json`, 'utf8') });
    }
  } }],
});
