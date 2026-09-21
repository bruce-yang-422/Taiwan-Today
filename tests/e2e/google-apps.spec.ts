import { test, expect } from '@playwright/test';

test('Google app launcher supports keyboard, dismissal and mobile layouts', async ({ page }) => {
  await page.goto('/newtab.html');
  const toggle = page.getByRole('button', { name:'Google 應用程式', exact:true });
  const panel = page.getByRole('navigation', { name:'Google 常用應用程式' });
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(panel).toBeVisible();
  const links = panel.locator('a');
  await expect(links).toHaveCount(3);
  expect(await links.evaluateAll(items=>items.map(a=>(a as HTMLAnchorElement).href))).toEqual(['https://mail.google.com/','https://drive.google.com/','https://calendar.google.com/']);
  await page.keyboard.press('Tab'); await expect(links.first()).toBeFocused();
  await page.keyboard.press('Escape'); await expect(panel).toBeHidden(); await expect(toggle).toBeFocused();
  await toggle.click(); await page.locator('#day').click(); await expect(panel).toBeHidden();
  await page.setViewportSize({width:360,height:800});
  for (const style of ['classic','modern','traditional','workspace','reading']) {
    await page.locator('#settings-open').click(); await page.getByLabel('日曆樣式').selectOption(style);
    await expect(page.locator('#calendar-style')).toBeEnabled(); await page.keyboard.press('Escape');
    await toggle.click(); await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x+box.width).toBeLessThanOrEqual(360);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    await page.keyboard.press('Escape');
  }
});
