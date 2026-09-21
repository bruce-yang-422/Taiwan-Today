import { test, expect } from '@playwright/test';

for (const scale of [1, 1.25, 1.5]) {
  test(`reading sizes across five styles at laptop scale ${scale}`, async ({ page }) => {
    // Browser zoom reduces the CSS viewport; DPR alone does not exercise reflow.
    await page.setViewportSize({ width: Math.floor(1366 / scale), height: Math.floor(768 / scale) });
    await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
    await page.goto('/newtab.html');
    for (const style of ['classic', 'modern', 'traditional', 'workspace', 'reading']) {
      for (const size of ['standard', 'large']) {
        await page.locator('#settings-open').click();
        await page.locator('#calendar-style').selectOption(style);
        await expect(page.locator('#text-size')).toBeEnabled();
        await page.getByLabel('文字大小').selectOption(size);
        await expect(page.locator('html')).toHaveAttribute('data-text-size', size);
        await expect(page.locator('#text-size')).toBeEnabled();
        await page.locator('[data-close="settings-dialog"]').click();
        await expect(page.locator('.history-summary').first()).toHaveCSS('font-size', size === 'large' ? '17px' : '14px');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        for (const selector of ['.history-summary', '.history-source']) {
          for (const item of await page.locator(selector).all()) {
            expect(await item.evaluate(e => e.scrollWidth <= e.clientWidth + 1 && e.scrollHeight <= e.clientHeight + 1)).toBe(true);
          }
        }
      }
    }
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'large');
    await page.locator('#settings-open').click();
    await expect(page.getByLabel('文字大小')).toHaveValue('large');
    await page.locator('[data-close="settings-dialog"]').click();
  });
}
