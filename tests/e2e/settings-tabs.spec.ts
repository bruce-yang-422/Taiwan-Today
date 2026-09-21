import { test, expect } from '@playwright/test';

test('settings tabs group controls and remain usable on laptop and mobile', async ({ page }) => {
  await page.goto('/newtab.html');
  await page.locator('#settings-open').click();
  await expect(page.getByRole('tab', { name: '外觀', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByLabel('日曆樣式')).toBeVisible();
  await expect(page.locator('#personal-history-open')).toBeHidden();
  await page.getByRole('tab', { name: '外觀', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('每日一句分類')).toBeVisible();
  await expect(page.locator('#history-sources')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('#about-version')).toHaveText('1.0.0');
  for (const viewport of [{ width: 1366, height: 768 }, { width: 360, height: 640 }]) {
    await page.setViewportSize(viewport);
    for (const name of ['外觀', '內容', '資料管理', '關於']) {
      await page.getByRole('tab', { name, exact: true }).click();
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      const dialog = await page.locator('#settings-dialog').boundingBox();
      expect(dialog!.y).toBeGreaterThanOrEqual(0);
      expect(dialog!.y + dialog!.height).toBeLessThanOrEqual(viewport.height);
      expect(await page.locator('#settings-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await expect(page.locator('#settings-dialog [data-close]')).toBeInViewport();
    }
  }
  await page.getByRole('tab', { name: '資料管理', exact: true }).click();
  await page.locator('#personal-history-open').click();
  await expect(page.locator('#personal-history-dialog')).toBeVisible();
  await expect(page.getByRole('link', { name: /前往官網製作 JSON/ })).toHaveAttribute('href', 'https://bruce-yang-422.github.io/Taiwan-Today/#converter');
});
