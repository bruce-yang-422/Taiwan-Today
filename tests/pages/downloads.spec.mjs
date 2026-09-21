import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('website offers three exact template downloads without a converter',async({page})=>{
 const requests=[]; page.on('request',r=>requests.push(r.url()));
 await page.goto('/');
 await expect(page.locator('script,input[type=file],textarea,#convert,#output')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'下載範本，留住你的故事'})).toBeVisible();
 for(const format of ['csv','xlsx','ods']){
  const pending=page.waitForEvent('download'); await page.locator(`#${format}-template`).click();
  const file=await pending;
  expect(file.suggestedFilename()).toBe(`history-template.${format}`);
  expect(readFileSync(await file.path())).toEqual(readFileSync(`templates/history-template.${format}`));
 }
 expect(requests.some(url=>url.includes('xlsx.full.min')||url.includes('app.js'))).toBe(false);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/#converter');
 await expect(page.locator('#converter')).toHaveCount(1);
});
