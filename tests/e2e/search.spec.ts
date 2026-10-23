import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, basename } from 'node:path';

for (const style of ['classic', 'modern', 'traditional', 'workspace', 'reading']) {
  test(`${style} routes text and history searches through Chrome Search API`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
    await page.goto('/newtab.html');
    await expect(page.locator('#day')).not.toBeEmpty();
    await page.evaluate(() => {
      (window as any).chrome ??= {};
      (window as any).searchCalls = [];
      (window as any).chrome.search = { query: async (info: unknown) => { (window as any).searchCalls.push(info); } };
    });
    await page.locator('#settings-open').click();
    await page.locator('#calendar-style').selectOption(style);
    await page.keyboard.press('Escape');
    await expect(page.getByLabel('搜尋網頁', { exact: true })).toBeVisible();
    await expect(page.locator('#search-form')).not.toHaveAttribute('action', /google/);
    await page.locator('#search-input').fill('  台灣 & 日曆  ');
    await page.locator('#search-input').press('Enter');
    await expect.poll(() => page.evaluate(() => (window as any).searchCalls)).toEqual([{ text: '台灣 & 日曆', disposition: 'CURRENT_TAB' }]);
    const keyword = await page.locator('.history-card h3').first().textContent();
    await page.locator('.history-more').first().click();
    const calls = await page.evaluate(() => (window as any).searchCalls);
    expect(calls).toHaveLength(2);
    expect(calls[1].text.trim()).not.toBe('');
    expect(calls[1].disposition).toBe('CURRENT_TAB');
    expect(keyword).toBeTruthy();
    await expect(page).toHaveURL(/newtab.html$/);
    await expect(page.locator('#image-search-dialog, #image-search-form, #image-search-file')).toHaveCount(0);
  });
}

test('API errors and unavailable API retain the query without sending it to another provider', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (/^https:\/\/(?:www\.)?(?:google\.com|bing\.com|lens\.google\.com)\//.test(request.url())) requests.push(request.url()); });
  await page.goto('/newtab.html');
  await expect(page.locator('#day')).not.toBeEmpty();
  await page.evaluate(() => { (window as any).chrome ??= {}; delete (window as any).chrome.search; });
  await page.locator('#search-input').fill('保留文字');
  await page.locator('#search-input').press('Enter');
  await expect(page.locator('#status')).toContainText('搜尋功能僅適用於已安裝');
  await page.evaluate(() => { (window as any).chrome.search = { query: async () => { throw new Error('failed'); } }; });
  await page.locator('#search-input').press('Enter');
  await expect(page.locator('#status')).toContainText('無法開啟搜尋');
  await expect(page.locator('#search-input')).toHaveValue('保留文字');
  await page.locator('.history-more').first().click();
  await expect(page.locator('#status')).toContainText('無法開啟搜尋');
  expect(await page.locator('#search-input').evaluate(input => {
    const clipboard = new DataTransfer();
    clipboard.items.add(new File([new Uint8Array(10)], 'test.png', { type: 'image/png' }));
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: clipboard });
    input.dispatchEvent(event);
    return event.defaultPrevented;
  })).toBe(false);
  expect(requests).toEqual([]);
});

test('packaged v1.1.0 uses the real Chrome Search API and browser default provider', async () => {
  const profile = await mkdtemp(resolve(tmpdir(), 'taiwan-search-test-'));
  const extension = resolve('dist');
  const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  try {
    // Intercept the result page so this check does not depend on the search service network.
    await context.route('https://www.google.com/search?**', route => route.fulfill({ contentType: 'text/html', body: '<title>Default provider result</title>' }));
    const page = await context.newPage();
    await page.goto('chrome://newtab/');
    await expect(page.locator('#search-input')).toBeVisible();
    expect(await page.evaluate(() => chrome.runtime.getManifest().version)).toBe('1.1.0');
    expect(await page.evaluate(() => chrome.runtime.getManifest().permissions)).toContain('search');
    await page.locator('#search-input').fill('台灣 & 日曆');
    await page.locator('#search-input').press('Enter');
    await expect(page).toHaveTitle('Default provider result');
    expect(new URL(page.url()).searchParams.get('q')).toBe('台灣 & 日曆');
  } finally {
    await context.close();
    if (dirname(resolve(profile)) !== resolve(tmpdir()) || !basename(profile).startsWith('taiwan-search-test-')) throw new Error('Unexpected profile');
    await rm(profile, { recursive: true, force: true });
  }
});
