import { test, expect } from '@playwright/test';

const translations = {
  'zh-TW': { lang: 'zh-Hant-TW', title: '台灣今日曆', month: '十月', weekday: '星期日', settings: '開啟設定', tabs: ['外觀', '內容', '資料管理', '關於'], term: '霜降' },
  en: { lang: 'en', title: 'Taiwan Today', month: 'October', weekday: 'Sunday', settings: 'Open settings', tabs: ['Appearance', 'Content', 'Data', 'About'], term: 'First Frost' },
  ja: { lang: 'ja', title: '台湾こよみ', month: '10月', weekday: '日曜日', settings: '設定を開く', tabs: ['外観', 'コンテンツ', 'データ管理', '概要'], term: '霜降' },
};

for (const locale of ['zh-TW', 'en', 'ja'] as const) {
  test.describe(locale, () => {
    test.use({ locale });
    test('browser language applies to five styles, dialogs and responsive settings', async ({ page }) => {
      const copy = translations[locale], errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install({ time: new Date('2026-10-25T12:00:00+08:00') });
      await page.goto('/newtab.html');
      await expect(page.locator('html')).toHaveAttribute('lang', copy.lang);
      await expect(page).toHaveTitle(copy.title);
      await expect(page.locator('#month')).toHaveText(copy.month);
      await expect(page.locator('#weekday')).toHaveText(copy.weekday);
      await expect(page.locator('#term-current')).toHaveText(copy.term);
      await expect(page.locator('#shortcuts .shortcut-add').first()).toBeEnabled();
      for (const style of ['classic', 'modern', 'traditional', 'workspace', 'reading']) {
        await page.getByRole('button', { name: copy.settings, exact: true }).click();
        await page.locator('#calendar-style').selectOption(style);
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('preferences')!).style)).toBe(style);
        await page.keyboard.press('Escape');
        await expect(page.locator('#weekday')).toHaveText(copy.weekday);
        await expect(page.locator('#history-heading')).toHaveText(locale === 'en' ? 'On this day' : locale === 'ja' ? '今日は何の日' : '歷史上的今天');
        if (style === 'workspace') {
          await expect(page.locator('.month-weekday').first()).toHaveText(locale === 'en' ? 'Sun' : '日');
          await page.locator('.month-cell[aria-label="2026-10-26"]').click();
          await expect(page.locator('#day')).toHaveText('26');
          await page.getByRole('button', { name: locale === 'en' ? 'Back to today' : locale === 'ja' ? '今日に戻る' : '回到今天', exact: true }).click();
        }
        for (const viewport of [{ width: 1366, height: 768 }, { width: 360, height: 800 }]) {
          await page.setViewportSize(viewport);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale}/${style}: page overflow at ${viewport.width}`).toBe(true);
          await page.locator('#settings-open').click();
          for (const name of copy.tabs) {
            await page.getByRole('tab', { name, exact: true }).click();
            expect(await page.locator('#settings-dialog').evaluate(el => el.scrollWidth <= el.clientWidth), `${locale}/${style}/${name}: dialog overflow`).toBe(true);
            await expect(page.locator('#settings-dialog > .dialog-actions button')).toBeInViewport();
          }
          await page.locator('#settings-tab-appearance').click();
          await page.keyboard.press('Escape');
        }
        await page.setViewportSize({ width: 1366, height: 768 });
        if (locale === 'en') await page.screenshot({ path: `test-results/i18n-${style}.png`, fullPage: true });
      }
      expect(errors).toEqual([]);
    });
  });
}

test('manual language choice persists, auto follows browser and user content stays unchanged', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('i18nSeeded')) return;
    localStorage.setItem('i18nSeeded', 'true');
    localStorage.setItem('shortcuts', JSON.stringify([{ id: 'custom', name: '設定 {0}<b>我的網站', url: 'https://example.com/', order: 0 }]));
    localStorage.setItem('personalHistory', JSON.stringify([{ date: '10-25', year: 2000, title: '我的生日', summary: '私人內容不應翻譯。', region: '家族' }]));
  });
  await page.clock.install({ time: new Date('2026-10-25T12:00:00+08:00') });
  await page.goto('/newtab.html');
  for (const language of ['en', 'ja', 'zh-TW', 'auto']) {
    await page.locator('#settings-open').click();
    await Promise.all([page.waitForEvent('load'), page.locator('#language').selectOption(language)]);
    await expect(page.locator('html')).toHaveAttribute('lang', language === 'auto' || language === 'zh-TW' ? 'zh-Hant-TW' : language);
    await expect(page.locator('.shortcut-name').first()).toHaveText('設定 {0}<b>我的網站');
    await expect(page.locator('.history-card h3').first()).toHaveText('我的生日');
    await page.locator('#settings-open').click();
    await expect(page.locator('#language')).toHaveValue(language);
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', language === 'auto' || language === 'zh-TW' ? 'zh-Hant-TW' : language);
  }
});

test('English catalog search and personal import errors are translated', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('/newtab.html');
  await page.getByRole('button', { name: 'Popular websites', exact: true }).click();
  await page.locator('#website-catalog-search').fill('railway');
  await expect(page.locator('.catalog-site strong')).toHaveText(['Taiwan Railway']);
  await page.keyboard.press('Escape');
  await page.locator('#settings-open').click();
  await page.getByRole('tab', { name: 'Data', exact: true }).click();
  await page.locator('#personal-history-open').click();
  await page.locator('#personal-history-file').setInputFiles({ name: 'bad.csv', mimeType: 'text/csv', buffer: Buffer.from('date,year,title,summary\n02-30,2026,title,summary') });
  await expect(page.locator('#personal-history-status')).toHaveText('Row 2: Date does not exist. Check the month, day and leap year.');
  await expect(page.locator('#personal-history-save')).toBeDisabled();
  await context.close();
});
