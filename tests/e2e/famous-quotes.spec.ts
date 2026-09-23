import { test, expect } from '@playwright/test';
import quotes from '../../data/quotes.json' with { type: 'json' };

test('removed quote category falls back to daily reminders', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-23T12:00:00+08:00') });
  await page.addInitScript(() => {
    localStorage.setItem('preferences', JSON.stringify({ quoteCategory: 'taiwanese-proverb' }));
  });
  await page.goto('/newtab.html');
  await page.locator('#settings-open').click();
  await page.locator('#settings-tab-content').click();
  await expect(page.locator('#quote-category')).toBeEnabled();
  await expect(page.locator('#quote-category')).toHaveValue('daily');
  await expect(page.locator('#quote-category option[value="taiwanese-proverb"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  const entries = quotes.data.filter(q => q.category === 'daily');
  const index = Math.floor(Date.UTC(2026, 8, 23) / 86400000) % entries.length;
  await expect(page.locator('#daily-quote blockquote')).toHaveText(entries[index].text);
});

for (const category of ['famous', 'sheng-yen', 'classics', 'literature', 'bible', 'screen']) {
test(`${category} quotes persist, render in all styles and rotate at Taiwan midnight`, async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-23T23:59:00+08:00') });
  await page.goto('/newtab.html');
  await page.locator('#settings-open').click();
  await page.locator('#settings-tab-content').click();
  await page.locator('#quote-category').selectOption(category);
  await expect(page.locator('#quote-category')).toBeEnabled();
  await page.keyboard.press('Escape');
  const entries = quotes.data.filter(q => q.category === category);
  const expectedCount = category === 'screen' ? 33 : 366;
  expect(entries).toHaveLength(expectedCount);
  expect(new Set(entries.map(q => q.text)).size).toBe(expectedCount);
  const index = Math.floor(Date.UTC(2026, 8, 23) / 86400000) % entries.length;
  const quote = page.locator('#daily-quote blockquote');
  await expect(quote).toHaveText(entries[index].text);
  await expect(page.locator('#daily-quote p')).toHaveText(`— ${entries[index].source}`);
  await page.reload();
  await expect(quote).toHaveText(entries[index].text);
  await page.locator('#settings-open').click();
  await page.locator('#settings-tab-content').click();
  await expect(page.locator('#quote-category')).toHaveValue(category);
  await page.keyboard.press('Escape');
  for (const style of ['classic', 'modern', 'traditional', 'workspace', 'reading']) {
    await page.locator('#settings-open').click();
    await page.locator('#settings-tab-appearance').click();
    await page.locator('#calendar-style').selectOption(style);
    await expect(page.locator('#calendar-style')).toBeEnabled();
    await page.keyboard.press('Escape');
    await expect(quote).toBeVisible();
    await expect(quote).toHaveText(entries[index].text);
  }
  await page.clock.fastForward(90_000);
  await expect(quote).toHaveText(entries[(index + 1) % entries.length].text);
});
}
