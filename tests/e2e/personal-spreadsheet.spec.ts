import { test, expect, chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

test('packaged extension reads spreadsheets offline under MV3 CSP', async () => {
  const extension = resolve('dist');
  const context = await chromium.launchPersistentContext('', { channel: 'chromium', headless: true, args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  try {
    await context.setOffline(true);
    const page = await context.newPage();
    await page.goto('chrome://newtab/');
    await page.locator('#settings-open').click();
    await page.getByRole('tab', { name: '資料管理', exact: true }).click();
    await page.locator('#personal-history-open').click();
    for (const format of ['xlsx', 'ods']) {
      await page.locator('#personal-history-file').setInputFiles(`templates/history-template.${format}`);
      await expect(page.locator('#personal-history-status')).toContainText('已驗證 2 筆');
    }
    await page.locator('#personal-history-save').click();
    await expect(page.locator('#personal-history-status')).toContainText('已匯入 2 筆');
    expect(await page.evaluate(async () => {
      const value = (await chrome.storage.local.get('personalHistory')).personalHistory;
      return Array.isArray(value) ? value.length : -1;
    })).toBe(2);
  } finally { await context.close(); }
});

for (const format of ['xlsx', 'ods']) {
  test(`imports ${format} locally and previews selected sheets`, async ({ page }) => {
    const context = { exports: {} as any };
    runInNewContext(readFileSync('vendor/sheetjs/xlsx.full.min.js', 'utf8'), context);
    const xlsx = context.exports;
    const book = xlsx.utils.book_new();
    book.Workbook = { WBProps: { date1904: true } };
    xlsx.utils.book_append_sheet(book, xlsx.utils.aoa_to_sheet([['日期','標題','摘要','分類'],[1,'上學日','紀念','小明']]),'小明');
    xlsx.utils.book_append_sheet(book, xlsx.utils.aoa_to_sheet([['日期','年份','標題','摘要'],['02-30',2020,'錯誤','日期不存在']]),'錯誤資料');
    const bytes = Buffer.from(xlsx.write(book, { type: 'array', bookType: format }));
    await page.goto('/newtab.html');
    await page.locator('#settings-open').click();
    await page.getByRole('tab', { name: '資料管理', exact: true }).click();
    await page.locator('#personal-history-open').click();
    await page.locator('#personal-history-file').setInputFiles(`templates/history-template.${format}`);
    await expect(page.locator('#personal-history-status')).toContainText('已驗證 2 筆');
    await page.locator('#personal-history-file').setInputFiles({name:`book.${format}`,mimeType:'application/octet-stream',buffer:bytes});
    await expect(page.locator('#personal-history-status')).toContainText('已驗證 1 筆');
    if (format === 'xlsx') await expect(page.locator('#personal-history-preview')).toContainText('1904-01-02');
    await page.locator('#personal-history-sheet').selectOption('1');
    await expect(page.locator('#personal-history-status')).toContainText('日期不存在');
    await expect(page.locator('#personal-history-save')).toBeDisabled();
    await expect(page.locator('#personal-history-preview')).toBeEmpty();
    await page.locator('#personal-history-sheet').selectOption('0');
    await page.locator('#personal-history-save').click();
    await expect(page.locator('#personal-history-status')).toContainText('已匯入 1 筆');
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('personalHistory')))!)[0].region).toBe('小明');
  });
}
