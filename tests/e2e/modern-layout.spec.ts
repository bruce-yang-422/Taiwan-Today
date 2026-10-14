import { test, expect } from '@playwright/test';

for (const style of ['modern', 'traditional']) {
test(`${style} desktop fits seven shortcuts, actions and history without page overflow`, async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
  await page.addInitScript(() => {
    localStorage.setItem('chatgptShortcutAdded', 'true');
    localStorage.setItem('shortcuts', JSON.stringify([
      ['youtube', 'YouTube', 'https://www.youtube.com/'],
      ['yahoo', 'Yahoo 奇摩', 'https://tw.yahoo.com/'],
      ['chatgpt', 'ChatGPT', 'https://chatgpt.com/'],
      ['gemini', 'Gemini', 'https://gemini.google.com/'],
      ['maps', 'Google 地圖', 'https://www.google.com/maps'],
      ['cwa', '中央氣象署', 'https://www.cwa.gov.tw/'],
      ['github', 'GitHub', 'https://github.com/'],
    ].map(([id, name, url], order) => ({ id, name, url, order }))));
  });
  await page.goto('/newtab.html');
  await page.locator('#settings-open').click();
  await page.locator('#calendar-style').selectOption(style);
  await page.keyboard.press('Escape');
  await page.locator('#todo-panel').evaluate((panel: HTMLDetailsElement) => { panel.open = true; });
  await expect(page.locator('#shortcuts > *')).toHaveCount(9);
  for (const [width, height] of [[1920,1080], [2560,1214], [1366,768]]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => {
      const tops = [...document.querySelectorAll('#shortcuts > *')].map(tile => tile.getBoundingClientRect().top);
      return { rows: new Set(tops).size, height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth, footerBottom: document.querySelector('footer')!.getBoundingClientRect().bottom };
    });
    expect(layout.rows, `${width}x${height}: shortcuts`).toBe(1);
    expect(layout.width).toBeLessThanOrEqual(width);
    expect(layout.height, `${width}x${height}: page height`).toBeLessThanOrEqual(height);
    expect(layout.footerBottom).toBeLessThanOrEqual(height);
    await page.screenshot({ path: `test-results/${style}-layout-${width}x${height}.png` });
  }
});
}
