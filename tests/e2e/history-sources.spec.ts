import { test, expect } from '@playwright/test';

test('history source priorities and enabled flags persist, sync, and recover on write failure', async ({ page, context }) => {
  await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
  await page.goto('/newtab.html');
  await page.evaluate(() => localStorage.setItem('personalHistory', JSON.stringify([{date:'09-21',year:2010,title:'私人旅行紀事',summary:'家庭旅行',region:'國際'}])));
  await page.reload();
  const other = await context.newPage();
  await other.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
  await other.goto('/newtab.html');
  await expect(page.locator('#history h3').first()).toHaveText('私人旅行紀事');
  await page.locator('#settings-open').click();
  expect(await page.locator('#history-sources-list li').evaluateAll(rows => rows.map(r => (r as HTMLElement).dataset.source))).toEqual(['personal', 'taiwan', 'world']);
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', {name:'上移國際',exact:true}).click();
    await expect(page.locator('#history-sources')).toBeEnabled();
  }
  await expect(page.locator('#history h3').first()).toContainText('法國國民公會');
  await expect(other.locator('#history h3').first()).toContainText('法國國民公會');
  await page.reload();
  await expect(page.locator('#history h3').first()).toContainText('法國國民公會');
  await page.locator('#settings-open').click();
  await page.locator('#history-source-world').uncheck();
  await expect(page.locator('#history-sources')).toBeEnabled();
  await expect(page.locator('#history h3').first()).toHaveText('私人旅行紀事');
  await expect(page.locator('#history')).not.toContainText('法國國民公會');
  for (const id of ['personal', 'taiwan']) {
    await page.locator(`#history-source-${id}`).uncheck();
    await expect(page.locator('#history-sources')).toBeEnabled();
  }
  await expect(page.locator('#history')).toContainText('目前沒有可顯示的紀事');
  await expect(page.locator('#history-expansion')).toBeHidden();
  await page.locator('#history-source-personal').check();
  await expect(page.locator('#history-sources')).toBeEnabled();
  await expect(page.locator('#history h3').first()).toHaveText('私人旅行紀事');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.locator('#history-source-personal').click();
  await expect(page.locator('#history-source-personal')).toBeChecked();
  await expect(page.locator('#history h3').first()).toHaveText('私人旅行紀事');
  await expect(page.locator('#status')).toContainText('無法儲存');
});
