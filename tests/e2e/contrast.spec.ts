import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { checkDecoratedText } from './contrastPixels';

// SC 1.4.3: audit rendered colors (including inherited opacity), not just tokens.
// Image/gradient backgrounds can require manual review; retain those in the report.
for (const style of ['classic', 'modern', 'traditional', 'workspace', 'reading']) {
  for (const theme of ['light', 'dark']) {
    test(`${style} ${theme} text contrast`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      await page.clock.install({ time: new Date('2026-09-21T12:00:00+08:00') });
      await page.goto('/newtab.html');
      await page.locator('#settings-open').click();
      await page.locator('#calendar-style').selectOption(style);
      await page.getByRole('radio', { name: theme === 'light' ? '亮色' : '暗色', exact: true }).check();
      await page.locator('[data-close="settings-dialog"]').click();
      const audit = async (state: string) => {
        const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
        await testInfo.attach(`${state}-contrast`, {
          body: JSON.stringify({ violations: results.violations, review: results.incomplete }, null, 2),
          contentType: 'application/json',
        });
        expect.soft(results.violations.flatMap(v => v.nodes.map(n => ({
          target: n.target, issue: n.failureSummary,
        }))), state).toEqual([]);
      };
      await page.locator('#todo-panel').evaluate((e: HTMLDetailsElement) => { e.open = true; });
      await audit('empty-newtab');
      await checkDecoratedText(page);
      await page.locator('#todo-input').fill('確認今天的行程');
      await page.locator('#todo-input').press('Enter');
      await page.locator('#todo-list input[type=checkbox]').first().check();
      await audit('completed-todo');
      const sampled = await checkDecoratedText(page);
      await testInfo.attach('rendered-background-contrast', { body: JSON.stringify(sampled, null, 2), contentType: 'application/json' });
      await page.locator('#settings-open').click();
      for (const tab of await page.getByRole('tab').all()) {
        await tab.click();
        await audit(`settings-${await tab.textContent()}`);
      }
      await page.locator('[data-close="settings-dialog"]').click();
      await page.getByRole('button', { name: '新增捷徑', exact: true }).click();
      await audit('shortcut-dialog');
      await page.locator('[data-close="shortcut-dialog"]').click();
      await page.locator('#google-apps-toggle').click();
      await audit('google-apps');
    });
  }
}
