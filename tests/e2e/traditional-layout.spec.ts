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

test('paper calendar loads local numerals and prints correct months including leap years', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-15T12:00:00+08:00') });
  await page.addInitScript(() => localStorage.setItem('preferences', JSON.stringify({ style: 'traditional', appearance: 'light' })));
  for (const date of [
    { key: '2026-10-15', days: 31, offset: 4, red: false },
    { key: '2026-10-17', days: 31, offset: 4, red: true },
    { key: '2026-10-18', days: 31, offset: 4, red: true },
    { key: '2026-10-09', days: 31, offset: 4, red: true },
    { key: '2026-10-26', days: 31, offset: 4, red: true },
    { key: '2026-01-01', days: 31, offset: 4, red: true },
    { key: '2028-02-29', days: 29, offset: 2, red: false },
    { key: '2027-08-01', days: 31, offset: 0, red: true },
  ]) {
    await page.clock.setSystemTime(new Date(`${date.key}T12:00:00+08:00`));
    await page.goto('/newtab.html');
    const month = page.locator('#paper-mini-calendar');
    await expect(month.locator('time')).toHaveCount(date.days);
    await expect(month.locator('th')).toHaveText(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    await expect(month.locator('tbody tr').first().locator('td').nth(date.offset).locator('time')).toHaveText('1');
    await expect(month.locator('[aria-current=date]')).toHaveAttribute('datetime', date.key);
    await expect(page.locator('#day')).toHaveCSS('color', date.red ? 'rgb(178, 46, 43)' : 'rgb(23, 77, 145)');
    await expect(month.locator('[aria-current=date]')).toHaveCSS('background-color', date.red ? 'rgb(178, 46, 43)' : 'rgb(23, 77, 145)');
    for (const index of [0, 6]) await expect(month.locator('th').nth(index)).toHaveCSS('color', 'rgb(178, 46, 43)');
    for (const width of [1920, 1280, 360]) {
      await page.setViewportSize({ width, height: 1080 });
      const paper = (await page.locator('.calendar').boundingBox())!;
      const mini = (await month.boundingBox())!;
      const day = (await page.locator('#day').boundingBox())!;
      expect(mini.x).toBeGreaterThan(paper.x);
      expect(mini.x + mini.width).toBeLessThan(paper.x + paper.width);
      expect(mini.y + mini.height).toBeLessThan(day.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('32px "Paper Calendar Numerals"'))).toBe(true);
  for (const selector of ['#day', '.clock-numbers', '#digital-clock']) {
    await expect(page.locator(selector)).toHaveCSS('font-family', /Paper Calendar Numerals/);
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'test-results/traditional-printed-numerals.png', fullPage: true });
});
