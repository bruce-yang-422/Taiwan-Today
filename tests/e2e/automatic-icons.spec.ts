import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';

test('extension replaces Chrome globe, retries, caches and refreshes changed icons', async () => {
  const profile = await mkdtemp(resolve(tmpdir(), 'taiwan-icon-test-'));
  const extension = resolve('dist');
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const firstIcon = await readFile('public/icons/youtube.png');
    const secondIcon = await readFile('public/icons/github.ico');
    let requests = 0, fail = false, changed = false;
    const cookieHeaders: string[] = [];
    await context.route('https://**/*', async route => {
      const url = route.request().url();
      cookieHeaders.push(route.request().headers().cookie || '');
      if (url === 'https://tw.yahoo.com/') {
        requests++;
        if (fail || requests < 3) return route.fulfill({ status: 503, body: 'temporary failure' });
        return route.fulfill({ contentType: 'text/html', body: '<link rel="icon" href="https://s.yimg.com/test/favicon">' });
      }
      if (url === 'https://s.yimg.com/test/favicon' && !fail) {
        return route.fulfill({ contentType: changed ? 'image/x-icon' : 'image/png', body: changed ? secondIcon : firstIcon });
      }
      return route.fulfill({ status: 404, body: 'not found' });
    });
    await context.setOffline(true);
    const page = await context.newPage();
    await page.goto('chrome://newtab/');
    await expect(page.getByRole('button', { name: '新增捷徑', exact: true })).toBeEnabled();
    await page.evaluate(async () => {
      await chrome.storage.local.set({ shortcuts: [{ id: 'yahoo', name: 'Yahoo 奇摩', url: 'https://tw.yahoo.com/', order: 0 }], chatgptShortcutAdded: true });
    });
    await context.addCookies([{ name: 'login', value: 'secret', domain: 'tw.yahoo.com', path: '/' }]);
    await context.setOffline(false);
    await page.reload();
    const image = page.getByRole('link', { name: 'Yahoo 奇摩', exact: true }).locator('img');
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/, { timeout: 20000 });
    expect(requests).toBe(3);
    const original = await image.getAttribute('src');
    expect(cookieHeaders.every(header => header === '')).toBe(true);
    await page.reload();
    await expect(image).toHaveAttribute('src', original!);
    expect(requests).toBe(3);

    const expire = async () => page.evaluate(async () => {
      const { automaticShortcutIcons } = await chrome.storage.local.get('automaticShortcutIcons');
      const cache = automaticShortcutIcons as Record<string, { icon?: string; checked: number; retryAfter?: number }>;
      cache['https://tw.yahoo.com'].checked = Date.now() - 8 * 86400000;
      delete cache['https://tw.yahoo.com'].retryAfter;
      await chrome.storage.local.set({ automaticShortcutIcons: cache });
    });
    await expire(); changed = true;
    await page.reload();
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
    await expect.poll(() => image.getAttribute('src')).not.toBe(original);
    const updated = await image.getAttribute('src');
    expect(requests).toBe(4);

    await expire(); fail = true;
    await page.reload();
    await expect(image).toHaveAttribute('src', updated!);
    await expect.poll(async () => page.evaluate(async () => {
      const { automaticShortcutIcons } = await chrome.storage.local.get('automaticShortcutIcons');
      return (automaticShortcutIcons as Record<string, { retryAfter?: number }>)['https://tw.yahoo.com'].retryAfter || 0;
    }), { timeout: 20000 }).toBeGreaterThan(Date.now());
    expect(requests).toBe(7);
    await page.reload();
    await expect(image).toHaveAttribute('src', updated!);
    expect(requests).toBe(7);

    await page.evaluate(async icon => {
      await chrome.storage.local.set({ shortcuts: [{ id: 'yahoo', name: 'Yahoo 奇摩', url: 'https://tw.yahoo.com/', order: 0, icon }] });
    }, original);
    await expect(image).toHaveAttribute('src', original!);
    await page.reload();
    await expect(image).toHaveAttribute('src', original!);
    expect(requests).toBe(7);
    await page.evaluate(async () => {
      const artwork = (color: string, opaque = false) => {
        const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d')!;
        if (opaque) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 32, 32); }
        ctx.strokeStyle = color; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(16, 16, 9, 0, Math.PI * 2); ctx.stroke();
        return canvas.toDataURL();
      };
      await chrome.storage.local.set({
        shortcuts: [
          { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', order: 0 },
          { id: 'dark', name: 'Dark artwork', url: 'https://example.com/', order: 1, icon: artwork('#000') },
          { id: 'opaque', name: 'Opaque artwork', url: 'https://example.org/', order: 2, icon: artwork('#000', true) },
        ],
        automaticShortcutIcons: { 'https://chatgpt.com': { icon: artwork('#fff'), checked: Date.now() } },
      });
    });
    await page.reload();
    const white = page.getByRole('link', { name: 'ChatGPT', exact: true }).locator('.shortcut-icon');
    const black = page.getByRole('link', { name: 'Dark artwork', exact: true }).locator('.shortcut-icon');
    const opaque = page.getByRole('link', { name: 'Opaque artwork', exact: true }).locator('.shortcut-icon');
    await expect(white).toHaveClass(/icon-light-artwork/);
    await expect(black).toHaveClass(/icon-dark-artwork/);
    await expect(opaque).not.toHaveClass(/icon-(light|dark)-artwork/);
    for (const dark of [false, true]) {
      for (const style of ['classic', 'modern', 'workspace', 'reading', 'traditional']) {
        await page.evaluate(({ dark, style }) => {
          document.documentElement.classList.toggle('dark', dark);
          document.documentElement.dataset.style = style;
        }, { dark, style });
        await expect(white).toHaveCSS('background-color', 'rgb(37, 49, 68)');
        await expect(black).toHaveCSS('background-color', 'rgb(244, 243, 239)');
      }
    }
  } finally {
    await context.close();
    if (dirname(resolve(profile)) !== resolve(tmpdir()) || !basename(profile).startsWith('taiwan-icon-test-')) throw new Error('Unexpected profile path');
    await rm(profile, { recursive: true, force: true });
  }
});
