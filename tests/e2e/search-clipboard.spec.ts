import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, basename } from 'node:path';

async function pasteImage(page: Page) {
  return page.locator('#search-input').evaluate(input => {
    const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
    canvas.getContext('2d')!.fillRect(0,0,16,16);
    const bytes=Uint8Array.from(atob(canvas.toDataURL().split(',')[1]), c=>c.charCodeAt(0));
    const clipboard=new DataTransfer();clipboard.items.add(new File([bytes],'clipboard.png',{type:'image/png'}));
    const event=new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:clipboard});
    input.dispatchEvent(event);return event.defaultPrevented;
  });
}

for(const style of ['classic','modern','traditional','workspace','reading']) {
  test(`${style} previews pasted image and sends multipart to Lens only on search`, async ({ page, context }) => {
    let uploads=0, uploaded='';
    await context.route('https://lens.google.com/**', async route=>{
      uploads++;uploaded=route.request().postDataBuffer()?.toString('latin1') || '';
      expect(route.request().method()).toBe('POST');
      await route.fulfill({contentType:'text/html',body:'<title>Lens test result</title>'});
    });
    await page.goto('/newtab.html');
    await page.locator('#settings-open').click();
    await page.locator('#calendar-style').selectOption(style);
    await page.keyboard.press('Escape');
    await page.locator('#search-input').fill('保留文字');
    expect(await pasteImage(page)).toBe(true);
    const dialog=page.getByRole('dialog',{name:'以圖片搜尋 Google'});
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img')).toHaveAttribute('src', /^blob:/);
    expect(uploads).toBe(0);
    await dialog.getByRole('button',{name:'取消',exact:true}).click();
    await expect(dialog).not.toBeVisible();
    await expect.poll(()=>page.locator('#image-search-file').evaluate((input:HTMLInputElement)=>input.files!.length)).toBe(0);
    await expect(page.locator('#search-input')).toHaveValue('保留文字');
    await pasteImage(page);await expect(dialog).toBeVisible();
    const result=context.waitForEvent('page');
    await dialog.getByRole('button',{name:'以圖片搜尋',exact:true}).click();
    const tab=await result;await expect(tab).toHaveTitle('Lens test result');
    expect(uploads).toBe(1);
    expect(uploaded).toContain('name="encoded_image"; filename="clipboard.png"');
    expect(uploaded).toContain('Content-Type: image/png');
    await expect(dialog).not.toBeVisible();
    await tab.close();
  });
}

test('text paste and text search still work; invalid and oversized images stay local', async ({page})=>{
  await page.goto('/newtab.html');
  const plain=await page.locator('#search-input').evaluate(input=>{
    const clipboard=new DataTransfer();clipboard.setData('text/plain','測試');
    const event=new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:clipboard});
    input.dispatchEvent(event);return event.defaultPrevented;
  });
  expect(plain).toBe(false);
  for(const size of [10,20*1024*1024+1]) {
    await page.locator('#search-input').evaluate((input,size)=>{
      const clipboard=new DataTransfer();clipboard.items.add(new File([new Uint8Array(size)],'invalid.png',{type:'image/png'}));
      input.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:clipboard}));
    },size);
    await expect(page.locator('#status')).toContainText(size===10?'無法讀取':'20 MB');
    await expect(page.locator('#image-search-dialog')).not.toBeVisible();
  }
  await page.route('https://www.google.com/search?**',route=>route.fulfill({body:'<title>Text search result</title>',contentType:'text/html'}));
  await page.locator('#search-input').fill('台灣 天氣');
  await page.locator('#search-input').press('Enter');
  await expect(page).toHaveTitle('Text search result');
  expect(new URL(page.url()).searchParams.get('q')).toBe('台灣 天氣');
});

test('extension CSP permits clipboard preview and Lens form upload',async ()=>{
  const profile=await mkdtemp(resolve(tmpdir(),'taiwan-search-test-'));
  const extension=resolve('dist');
  const context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
  try {
    await context.route('https://lens.google.com/**',route=>route.fulfill({contentType:'text/html',body:'<title>Extension Lens result</title>'}));
    const page=await context.newPage();await page.goto('chrome://newtab/');
    await expect(page.locator('#search-input')).toBeVisible();
    await pasteImage(page);
    await expect(page.locator('#image-search-dialog')).toBeVisible();
    const result=context.waitForEvent('page');
    await page.getByRole('button',{name:'以圖片搜尋',exact:true}).click();
    const tab=await result;await expect(tab).toHaveTitle('Extension Lens result');
  } finally {
    await context.close();
    if(dirname(resolve(profile))!==resolve(tmpdir())||!basename(profile).startsWith('taiwan-search-test-'))throw new Error('Unexpected profile');
    await rm(profile,{recursive:true,force:true});
  }
});
