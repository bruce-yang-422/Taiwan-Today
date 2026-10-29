import { test, expect } from '@playwright/test';

test('clock fills the viewport and restores its position in every style', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
  await page.goto('/newtab.html');
  const clock = page.locator('.clock-container');
  const presentation = page.locator('#clock-presentation');
  for (const style of ['classic', 'modern', 'traditional', 'workspace', 'reading']) {
    await page.locator('#settings-open').click();
    await page.getByRole('tab', { name: '外觀', exact: true }).click();
    await page.locator('#calendar-style').selectOption(style);
    await page.keyboard.press('Escape');
    const original = await clock.boundingBox();
    const parent = await clock.evaluateHandle(element => element.parentElement);
    await clock.dblclick();
    await expect(presentation).toBeVisible();
    await expect(page.locator('#analog-clock')).toBeVisible();
    expect(await presentation.boundingBox()).toEqual({ x: 0, y: 0, width: 1280, height: 1000 });
    expect((await page.locator('#analog-clock').boundingBox())!.width).toBeGreaterThan(500);
    await expect(page.locator('.clock-date')).toHaveText('2026年9月21日 星期一');
    await expect(page.locator('.clock-date')).toHaveAttribute('datetime', '2026-09-21');
    for (const selector of ['#analog-clock', '#digital-clock', '.clock-date', '.clock-caption']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - 640)).toBeLessThan(1);
    }
    const faceBox = (await page.locator('#analog-clock').boundingBox())!;
    const captionBox = (await page.locator('.clock-caption').boundingBox())!;
    expect(Math.abs((faceBox.y + captionBox.y + captionBox.height) / 2 - 500)).toBeLessThan(1);
    const before = await page.locator('#digital-clock').textContent();
    await page.clock.fastForward(2000);
    await expect(page.locator('#digital-clock')).not.toHaveText(before!);
    await clock.dblclick();
    await expect(presentation).toBeHidden();
    await expect(clock).toBeVisible();
    await expect(page.locator('.clock-date')).toBeHidden();
    expect(await clock.evaluate((element, originalParent) => element.parentElement === originalParent, parent)).toBe(true);
    expect((await clock.boundingBox())!.y).toBe(original!.y);
    await parent.dispose();
    await clock.focus();
    await page.keyboard.press('Enter');
    await expect(presentation).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(presentation).toBeHidden();
    await expect(clock).toBeFocused();
  }
  await clock.dblclick();
  for (const viewport of [{ width: 3840, height: 1822 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    expect(await presentation.boundingBox()).toEqual({ x: 0, y: 0, ...viewport });
    for (const selector of ['#analog-clock', '#digital-clock', '.clock-date', '.clock-caption']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(1);
    }
  }
  await page.clock.setSystemTime(new Date('2026-09-21T23:59:59+08:00'));
  await page.clock.fastForward(2000);
  await expect(page.locator('.clock-date')).toHaveText('2026年9月22日 星期二');
  await page.keyboard.press('Escape');
  await expect(presentation).toBeHidden();
});
