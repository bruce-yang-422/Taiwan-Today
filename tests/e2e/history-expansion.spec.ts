import { test, expect } from '@playwright/test';

test('all styles reveal public history beyond three personal entries', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
  await page.addInitScript(() => localStorage.setItem('personalHistory', JSON.stringify([
    ...[1, 2, 3].map(i => ({ date: '09-21', year: 2000 + i, title: `家庭紀事 ${i}`, summary: '值得記住的一天', region: '家族' })),
    { date: '09-21', year: 2030, title: '未來紀事', summary: '尚未發生', region: '個人' },
  ])));
  await page.goto('/newtab.html');
  for (const style of ['classic', 'modern', 'traditional', 'reading', 'workspace']) {
    await page.locator('#settings-open').click();
    await page.getByLabel('日曆樣式').selectOption(style);
    await expect(page.locator('#calendar-style')).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(page.locator('#history .history-card')).toHaveCount(3);
    await expect(page.locator('#history')).not.toContainText('九二一');
    await expect(page.locator('#history-show-more')).toHaveText('顯示更多（另 3 則）');
    await page.locator('#history-show-more').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#history .history-card')).toHaveCount(6);
    await expect(page.locator('#history')).toContainText('九二一');
    await expect(page.locator('#history')).toContainText('法國國民公會');
    await expect(page.locator('#history')).not.toContainText('未來紀事');
    await expect(page.locator('#history-show-more')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#history-count')).toHaveText('顯示 6 / 6 則紀事');
    await page.locator('#history-show-more').click();
    await expect(page.locator('#history .history-card')).toHaveCount(3);
  }
  await page.locator('#history-show-more').click();
  await page.getByRole('button', { name: '2026-09-22', exact: true }).click();
  await expect(page.locator('#history-expansion')).toBeHidden();
  await page.getByRole('button', { name: '回到今天' }).click();
  await expect(page.locator('#history .history-card')).toHaveCount(3);
  await expect(page.locator('#history-show-more')).toHaveAttribute('aria-expanded', 'false');
});
