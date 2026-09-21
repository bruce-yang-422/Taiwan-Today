import { test, expect } from '@playwright/test';

test('shared display switches persist across styles and tabs without deleting data', async ({ page, context }) => {
  await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
  await page.goto('/newtab.html');
  const other = await context.newPage();
  await other.goto('/newtab.html');
  const widgets = [['show-history', '.history-section'], ['show-quote', '#daily-quote'], ['show-todos', '.todo-note']] as const;
  for (const style of ['classic', 'modern', 'traditional', 'workspace', 'reading']) {
    await page.locator('#settings-open').click();
    await page.locator('#calendar-style').selectOption(style);
    await expect(page.locator('#display-options')).toBeEnabled();
    for (const [id] of widgets) {
      await page.locator(`#${id}`).uncheck();
      await expect(page.locator('#display-options')).toBeEnabled();
    }
    await page.locator('#show-second-hand').uncheck();
    await expect(page.locator('#display-options')).toBeEnabled();
    await page.keyboard.press('Escape');
    for (const [, selector] of widgets) {
      await expect(page.locator(selector)).toBeHidden();
      await expect(other.locator(selector)).toBeHidden();
    }
    await expect(page.locator('#clock-second')).toHaveCSS('display', 'none');
    await expect(page.locator('#digital-clock')).toHaveText(/12:00:\d{2}/);
    await page.reload();
    for (const [, selector] of widgets) await expect(page.locator(selector)).toBeHidden();
    await page.locator('#settings-open').click();
    for (const [id] of widgets) {
      await page.locator(`#${id}`).check();
      await expect(page.locator('#display-options')).toBeEnabled();
    }
    await page.locator('#show-second-hand').check();
    await expect(page.locator('#display-options')).toBeEnabled();
    await page.keyboard.press('Escape');
    for (const [, selector] of widgets) await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator('#clock-second')).not.toHaveCSS('display', 'none');
    await expect(page.locator('#history')).toContainText('九二一');
    await expect(page.locator('#daily-quote blockquote')).not.toBeEmpty();
  }
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.locator('#settings-open').click();
  await page.locator('#show-quote').click();
  await expect(page.locator('#show-quote')).toBeChecked();
  await expect(page.locator('#status')).toContainText('無法儲存');
});


