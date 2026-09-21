import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('real screenshots switch themes and preserve their aspect ratio', async ({page}) => {
 await page.setViewportSize({width:1366,height:768});
 await page.goto('/');
 const screenshots = page.locator('[data-screenshot]');
 await expect(screenshots).toHaveCount(6);
 for (const theme of ['dark', 'light']) {
  const button = page.locator(`[data-screenshot-theme="${theme}"]`);
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed','true');
  for (const img of await screenshots.all()) {
   await img.scrollIntoViewIfNeeded();
   await expect(img).toHaveAttribute('src',new RegExp(`-${theme}\\.jpg$`));
   await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth === 1280)).toBe(true);
   expect(await img.evaluate(el => Math.abs(el.clientWidth / el.clientHeight - el.naturalWidth / el.naturalHeight))).toBeLessThan(.04);
   expect(await img.evaluate(el => el.clientWidth > el.parentElement.clientWidth)).toBe(true);
  }
 }
 for (const width of [1366,768,390]) {
  await page.setViewportSize({width,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('homepage exposes canonical and valid structured data', async ({page,request}) => {
 await page.goto('/');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://today.stack-base.com/');
 await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content',/https:\/\/today\.stack-base\.com\/docs\/site\/images\/modern-light\.jpg/);
 const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
 expect(data['@graph'].map(item=>item['@type'])).toEqual(['WebSite','SoftwareApplication']);
 expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://today.stack-base.com/sitemap.xml');
 expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>https://today.stack-base.com/</loc>');
});

test('website offers three exact template downloads and local conversion',async({page})=>{
 const requests=[]; page.on('request',r=>requests.push(r.url()));
 await page.goto('/');
 await expect(page.locator('#history-file')).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'下載範本，留住你的故事'})).toBeVisible();
 for(const format of ['csv','xlsx','ods']){
  const pending=page.waitForEvent('download'); await page.locator(`#${format}-template`).click();
  const file=await pending;
  expect(file.suggestedFilename()).toBe(`history-template.${format}`);
  expect(readFileSync(await file.path())).toEqual(readFileSync(`templates/history-template.${format}`));
 }
 expect(requests.every(url=>url.startsWith('http://127.0.0.1:8087/'))).toBe(true);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/#converter');
 await expect(page.locator('#converter')).toHaveCount(1);
});

for (const format of ['csv','xlsx','ods']) test(format + ' converts locally to personal JSON', async ({page}) => {
 await page.goto('/');
 await page.locator('#history-file').setInputFiles('templates/history-template.' + format);
 await expect(page.locator('#conversion-status')).toContainText('已整理好 2 筆紀事');
 await expect(page.locator('#sheet-field')).toBeHidden();
 const pending = page.waitForEvent('download');
 await page.locator('#download-json').click();
 const download = await pending;
 expect(download.suggestedFilename()).toBe('history-personal.json');
 const records = JSON.parse(readFileSync(await download.path(), 'utf8'));
 expect(records).toHaveLength(2);
 expect(records.some(r => r.title === '搬進第一個家')).toBe(true);
 await page.locator('#history-file').setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from('日期,年份,標題,摘要\n02-30,2020,錯誤,測試')});
 await expect(page.locator('#conversion-status')).toContainText('日期不存在');
 await expect(page.locator('#download-json')).toBeDisabled();
 await expect(page.locator('#conversion-preview li')).toHaveCount(0);
});
