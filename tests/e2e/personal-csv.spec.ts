import { test, expect } from '@playwright/test';

test('CSV imports locally after confirmation and invalid replacements preserve saved history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
  await page.goto('/newtab.html');
  await page.locator('#settings-open').click();
  await page.getByRole('tab', { name: '資料管理', exact: true }).click();
  await page.locator('#personal-history-open').click();
  const select = (body: string) => page.locator('#personal-history-file').setInputFiles({ name: 'events.csv', mimeType: 'text/csv', buffer: Buffer.from(body) });
  await select('日期,年份,標題,摘要,分類\n09-21,2020,第一天上學,一起拍照留念,小明');
  await expect(page.locator('#personal-history-preview')).toContainText('第一天上學');
  expect(await page.evaluate(() => localStorage.getItem('personalHistory'))).toBeNull();
  await page.locator('#personal-history-save').click();
  await expect(page.locator('#personal-history-status')).toContainText('已匯入 1 筆');
  const saved = await page.evaluate(() => localStorage.getItem('personalHistory'));
  expect(JSON.parse(saved!)[0].region).toBe('小明');
  await select('日期,年份,標題,摘要\n02-30,2020,錯誤,不應取代');
  await expect(page.locator('#personal-history-status')).toContainText('日期不存在');
  await expect(page.locator('#personal-history-save')).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('personalHistory'))).toBe(saved);
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.history-card').first()).toContainText('第一天上學');
  await expect(page.locator('.history-card').first()).toContainText('小明');
});
