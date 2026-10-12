import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('large PNG and ICO with generic MIME import, shrink and persist', async ({ page }) => {
  await page.goto('/newtab.html');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.createImageData(256, 256);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = Math.random() * 256;
      data.data[i + 1] = Math.random() * 256;
      data.data[i + 2] = Math.random() * 256;
      data.data[i + 3] = 128;
    }
    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL().split(',')[1];
  });
  const files = [
    { name: 'large.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') },
    { name: 'large.ico', mimeType: 'application/octet-stream', buffer: Buffer.concat([await readFile('public/icons/github.ico'), Buffer.alloc(70000)]) },
  ];
  for (const file of files) {
    expect(file.buffer.length).toBeGreaterThan(65536);
    await page.getByRole('button', { name: '新增捷徑', exact: true }).click();
    await page.locator('#shortcut-name').fill(file.name);
    await page.locator('#shortcut-url').fill('https://example.com/');
    await page.locator('#shortcut-icon').setInputFiles(file);
    await page.getByRole('button', { name: '完成', exact: true }).click();
    await expect(page.locator('#shortcut-dialog')).not.toBeVisible();
    await page.reload();
    const image = page.getByRole('link', { name: file.name, exact: true }).locator('img');
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/);
    const result = await image.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight, length: img.src.length };
    });
    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(64);
    expect(result.length).toBeLessThan(90000);
  }
  await page.getByRole('button', { name: '新增捷徑', exact: true }).click();
  await page.locator('#shortcut-name').fill('invalid');
  await page.locator('#shortcut-url').fill('https://example.com/');
  for (const file of [
    { name: 'oversize.ico', mimeType: 'image/x-icon', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) },
    { name: 'fake.ico', mimeType: 'image/x-icon', buffer: Buffer.from('invalid image') },
  ]) {
    await page.locator('#shortcut-icon').setInputFiles(file);
    await page.getByRole('button', { name: '完成', exact: true }).click();
    await expect(page.locator('#shortcut-error')).toContainText(file.name === 'oversize.ico' ? '5 MB' : 'PNG 或 ICO');
    await expect(page.locator('#shortcut-dialog')).toBeVisible();
  }
});
