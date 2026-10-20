import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';

test('extension uses Chrome favicons, preserves cached icons and blocks arbitrary website requests', async () => {
  const profile = await mkdtemp(resolve(tmpdir(), 'taiwan-icon-test-'));
  const extension = resolve('dist');
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  try {
    const firstIcon = (await readFile('public/icons/youtube.png')).toString('base64');
    const secondIcon = (await readFile('public/icons/taiwan-today.png')).toString('base64');
    const websiteRequests: string[] = [];
    await context.route('https://**/*', route => {
      if (new URL(route.request().url()).hostname === 'api.open-meteo.com') return route.fulfill({ json: { permitted: true } });
      websiteRequests.push(route.request().url()); return route.abort();
    });
    // Supply controlled Chrome favicon results, retaining the real default-icon endpoint.
    await context.addInitScript(({ firstIcon, secondIcon }) => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : String(input), location.href);
        if (url.origin === location.origin && url.pathname === '/_favicon/' && url.searchParams.get('pageUrl') === 'https://tw.yahoo.com/') {
          const { iconTestState } = await chrome.storage.local.get('iconTestState');
          const state = (iconTestState || {}) as { changed?: boolean; fail?: boolean; requests?: number };
          await chrome.storage.local.set({ iconTestState: { ...state, requests: (state.requests || 0) + 1 } });
          if (state.fail) throw new TypeError('Favicon unavailable');
          return new Response(Uint8Array.from(atob(state.changed ? secondIcon : firstIcon), c => c.charCodeAt(0)), { headers: { 'Content-Type': 'image/png' } });
        }
        return originalFetch(input, init);
      };
    }, { firstIcon, secondIcon });
    const page = await context.newPage();
    await page.goto('chrome://newtab/');
    await expect(page.getByRole('button', { name: '新增捷徑', exact: true })).toBeEnabled();
    const manifest = await page.evaluate(() => chrome.runtime.getManifest());
    expect(manifest.host_permissions).toEqual(['https://api.open-meteo.com/*']);
    expect(manifest.optional_host_permissions).toEqual(['https://raw.githubusercontent.com/*']);
    expect(await page.evaluate(async () => (await (await fetch('https://api.open-meteo.com/v1/forecast?latitude=25&longitude=121')).json()).permitted)).toBe(true);
    expect(await page.evaluate(() => chrome.permissions.contains({ origins:['https://example.com/*'] }))).toBe(false);
    expect(await page.evaluate(async () => {
      try { await fetch('https://example.com/'); return 'allowed'; } catch { return 'blocked'; }
    })).toBe('blocked');
    // The actual Chrome endpoint is still accessible with only the favicon permission.
    expect(await page.evaluate(async () => (await fetch(chrome.runtime.getURL('/_favicon/?pageUrl=https://taiwan-today-no-icon.invalid/&size=32'))).ok)).toBe(true);
    await page.evaluate(async () => {
      await chrome.storage.local.set({ shortcuts: [{ id: 'yahoo', name: 'Yahoo 奇摩', url: 'https://tw.yahoo.com/', order: 0 }], chatgptShortcutAdded: true });
    });
    const image = page.getByRole('link', { name: 'Yahoo 奇摩', exact: true }).locator('img');
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
    const original = await image.getAttribute('src');
    const requests = async () => page.evaluate(async () => {
      const { iconTestState } = await chrome.storage.local.get('iconTestState');
      return (iconTestState as { requests: number }).requests;
    });
    expect(await requests()).toBe(1);
    await page.reload(); await expect(image).toHaveAttribute('src', original!);
    expect(await requests()).toBe(1);
    const expire = async (fail: boolean) => page.evaluate(async fail => {
      const { automaticShortcutIcons, iconTestState } = await chrome.storage.local.get(['automaticShortcutIcons','iconTestState']);
      const cache = automaticShortcutIcons as Record<string, { checked: number; retryAfter?: number }>;
      cache['https://tw.yahoo.com'].checked = Date.now() - 8 * 86400000;
      delete cache['https://tw.yahoo.com'].retryAfter;
      await chrome.storage.local.set({ automaticShortcutIcons: cache, iconTestState: { ...(iconTestState as object), changed: true, fail } });
    }, fail);
    await expire(false); await page.reload();
    await expect.poll(requests).toBe(2);
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
    await expect.poll(() => image.getAttribute('src')).not.toBe(original);
    const updated = await image.getAttribute('src');
    expect(await requests()).toBe(2);
    await expire(true); await page.reload();
    await expect(image).toHaveAttribute('src', updated!);
    await expect.poll(async () => page.evaluate(async () => {
      const { automaticShortcutIcons } = await chrome.storage.local.get('automaticShortcutIcons');
      return (automaticShortcutIcons as Record<string, { retryAfter?: number }>)['https://tw.yahoo.com'].retryAfter || 0;
    })).toBeGreaterThan(Date.now());
    expect(await requests()).toBe(3);
    await page.reload(); await expect(image).toHaveAttribute('src', updated!);
    expect(await requests()).toBe(3);
    await page.evaluate(async icon => {
      await chrome.storage.local.set({ shortcuts: [{ id: 'yahoo', name: 'Yahoo 奇摩', url: 'https://tw.yahoo.com/', order: 0, icon }] });
    }, original);
    await expect(image).toHaveAttribute('src', original!);
    await page.reload(); await expect(image).toHaveAttribute('src', original!);
    expect(await requests()).toBe(3);
    expect(websiteRequests).toEqual([]);
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
