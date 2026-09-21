import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const names = ['history-taiwan.json','history-world.json','quotes.json','festivals.json','holidays.json','long-holidays.json','calendar-2026.json','calendar-2027.json'];
function release(marker: string, invalid = false) {
  const bodies: Record<string,string> = {};
  for (const name of names) {
    const value = JSON.parse(readFileSync(`data/${name}`,'utf8'));
    if (name === 'history-taiwan.json') for (const entry of value) if (entry.date === '09-21') entry.title = marker;
    if (name === 'quotes.json') for (const quote of value) quote.text = marker;
    if (invalid && name === 'festivals.json') value[0].calendar = 'execute-code';
    bodies[name] = JSON.stringify(value);
  }
  const files = names.map(name=>({name,bytes:Buffer.byteLength(bodies[name]),sha256:createHash('sha256').update(bodies[name]).digest('hex')}));
  const revision = createHash('sha256').update(JSON.stringify(files)).digest('hex');
  return { bodies, manifest: {schemaVersion:1,revision,files} };
}

test('public updates commit a complete validated cache and preserve private data offline', async ({ page, context }) => {
  let remote = release('遠端更新紀事'); let fail = false, corrupt = false;
  const requested: string[] = [];
  await context.route('https://raw.githubusercontent.com/**', async route => {
    const name = new URL(route.request().url()).pathname.split('/').pop()!; requested.push(name);
    if (fail) { await route.abort(); return; }
    const body = name === 'update-manifest.json' ? JSON.stringify(remote.manifest) : (corrupt ? '{}' : remote.bodies[name]);
    await route.fulfill({status:body ? 200 : 404,contentType:'application/json',body:body ?? '{}'});
  });
  await page.clock.install({time:new Date('2026-09-21T12:00:00+08:00')});
  await page.goto('/newtab.html');
  expect(requested).toEqual([]);
  await page.evaluate(()=>localStorage.setItem('personalHistory',JSON.stringify([{date:'09-21',year:2000,title:'我的私人成就',summary:'私人摘要',region:'個人'}])));
  await page.reload();
  await page.locator('#settings-open').click();
  await page.locator('#data-update-now').click();
  await expect(page.locator('#data-update-status')).toHaveText('資料更新完成，已立即套用。');
  await expect(page.locator('#history')).toContainText('遠端更新紀事');
  await expect(page.locator('#history')).toContainText('我的私人成就');
  await expect(page.locator('#daily-quote blockquote')).toHaveText('遠端更新紀事');
  expect(requested).not.toContain('history-personal.json');
  const cached = await page.evaluate(()=>localStorage.getItem('publicDataCache'));
  const count = requested.length;
  await page.locator('#data-update-now').click();
  await expect(page.locator('#data-update-status')).toHaveText('已是最新資料。');
  expect(requested.length).toBe(count+1);
  remote = release('不應套用的新內容', true);
  await page.locator('#data-update-now').click();
  await expect(page.locator('#data-update-status')).toContainText('更新未完成');
  expect(await page.evaluate(()=>localStorage.getItem('publicDataCache'))).toBe(cached);
  remote = release('另一版'); corrupt = true;
  await page.locator('#data-update-now').click();
  await expect(page.locator('#data-update-status')).toContainText('版本驗證失敗');
  expect(await page.evaluate(()=>localStorage.getItem('publicDataCache'))).toBe(cached);
  corrupt = false;
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='publicDataCache')throw Error('quota');return original.call(this,key,value);};});
  await page.locator('#data-update-now').click();
  await expect(page.locator('#data-update-status')).toContainText('更新未完成');
  await expect(page.locator('#history')).toContainText('遠端更新紀事');
  fail = true;
  await page.reload();
  await expect(page.locator('#history')).toContainText('遠端更新紀事');
  await expect(page.locator('#history')).toContainText('我的私人成就');
  await page.locator('#settings-open').click();await page.locator('#data-update-now').click();
  await expect(page.locator('#data-update-status')).toContainText('保留原資料');
});

test('automatic public updates are opt-in and limited to once per day', async ({ page, context }) => {
  const remote=release('自動更新');let checks=0;
  await context.route('https://raw.githubusercontent.com/**',async route=>{
    const name=new URL(route.request().url()).pathname.split('/').pop()!;
    if(name==='update-manifest.json')checks++;
    await route.fulfill({contentType:'application/json',body:name==='update-manifest.json'?JSON.stringify(remote.manifest):remote.bodies[name]});
  });
  await page.goto('/newtab.html');await page.locator('#settings-open').click();
  await expect(page.locator('#data-update-auto')).not.toBeChecked();expect(checks).toBe(0);
  await page.locator('#data-update-auto').check();
  await expect(page.locator('#data-update-status')).toContainText('資料更新完成');expect(checks).toBe(1);
  await page.reload();await page.locator('#settings-open').click();
  await expect(page.locator('#data-update-auto')).toBeChecked();
  await expect(page.locator('#data-update-now')).toBeEnabled();expect(checks).toBe(1);
});
