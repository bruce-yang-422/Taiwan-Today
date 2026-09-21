import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const legacy of [false, true]) {
  test(`file versions remain visible with ${legacy ? 'legacy cache' : 'bundled data'}`, async ({ page }) => {
    const manifest = JSON.parse(readFileSync('data/update-manifest.json', 'utf8'));
    if (legacy) {
      const files = Object.fromEntries(manifest.files.map((file: {name: string}) => [file.name, JSON.parse(readFileSync(`data/${file.name}`, 'utf8'))]));
      await page.addInitScript(cache => localStorage.setItem('publicDataCache', JSON.stringify(cache)), { schemaVersion: 1, revision: manifest.revision, updatedAt: '2026-09-21T00:00:00Z', files });
    }
    await page.setViewportSize({width:1366,height:768});
    await page.goto('/newtab.html');
    await page.locator('#settings-open').click();
    await page.getByRole('tab', { name: '關於', exact: true }).click();
    await page.locator('.about-file-details summary').click();
    await expect(page.locator('#about-data-files > div')).toHaveCount(manifest.files.length);
    await expect(page.locator('#about-data-files dt').first()).toBeInViewport();
    await expect(page.locator('#about-data-files-count')).toHaveText(`（${manifest.files.length} 個檔案）`);
    await page.locator('#about-data-files dt').last().scrollIntoViewIfNeeded();
    await expect(page.locator('#about-data-files dt').last()).toBeInViewport();
    await expect(page.locator('#about-data-files dd').first()).toHaveText(legacy ? '舊版未提供' : 'v1.0.0');
    if (legacy) await expect(page.locator('#about-data-files-note')).toBeVisible();
    else await expect(page.locator('#about-data-files-note')).toBeHidden();
  });
}
