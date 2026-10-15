import { test, expect } from '@playwright/test';

test('portrait calendar balances one, two and three history entries', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00+08:00') });
  await page.goto('/newtab.html');
  for (const count of [1, 2, 3]) {
    await page.evaluate(count => {
      localStorage.setItem('preferences', JSON.stringify({ style: 'traditional', appearance: 'light', historySources: [
        { id: 'personal', enabled: true },
        ...['taiwan', 'world', 'tech', 'entertainment'].map(id => ({ id, enabled: false })),
      ] }));
      localStorage.setItem('personalHistory', JSON.stringify(Array.from({ length: count }, (_, i) => ({
        date: '10-15', year: 2000 + i, title: `值得記住的生活紀事 ${i + 1}`,
        summary: '這是值得記錄的一天，與家人一起走訪熟悉的街道，留下生活的回憶。'.repeat(i + 2), region: '家族',
      }))));
    }, count);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await expect(page.locator('#history .history-card')).toHaveCount(count);
    const cards = await page.locator('#history .history-card').all();
    const boxes = await Promise.all(cards.map(card => card.boundingBox()));
    const calendar = (await page.locator('.calendar').boundingBox())!;
    for (let i = 0; i < count; i++) {
      expect(boxes[i]!.y).toBeCloseTo(boxes[0]!.y, 0);
      expect(boxes[i]!.x).toBeGreaterThan(calendar.x + calendar.width);
      if (i) expect(boxes[i]!.x).toBeGreaterThanOrEqual(boxes[i - 1]!.x + boxes[i - 1]!.width);
    }
    expect(calendar.height).toBeLessThan(1000);
    const month = (await page.locator('#month').boundingBox())!;
    const day = (await page.locator('#day').boundingBox())!;
    expect(day.y - month.y - month.height).toBeLessThan(60);
    await page.screenshot({ path: `test-results/traditional-history-${count}.png`, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await expect(page.locator('.history-card').last()).toBeVisible();
  }
});
