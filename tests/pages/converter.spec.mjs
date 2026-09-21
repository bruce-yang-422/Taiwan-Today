import {test,expect} from '@playwright/test';
import {convertRows} from '../../docs/site/converter.js';

test('rejects invalid dates, duplicates, conflicting years and unsafe sources',()=>{
 const h=['date','year','title','summary','sourceUrl'];
 expect(convertRows([h,['02-29',2027,'a','b','']]).errors).toHaveLength(1);
 expect(convertRows([h,['2024-02-29',2023,'a','b','']]).errors).toHaveLength(1);
 expect(convertRows([h,['02-29',2024,'a','b','javascript:alert(1)']]).errors).toHaveLength(1);
 expect(convertRows([h,['02-29',2024,'a','b',''],['02-29',2024,'a','b','']]).errors).toHaveLength(1);
 expect(convertRows([h,['02-29',2024,'a','b','']]).records[0]).toMatchObject({date:'02-29',year:2024,region:'個人',keyword:'',sourceUrl:''});
});

test('converts CSV locally, exports complete JSON and clears stale results',async({page})=>{
 const external=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8087'))external.push(r.url());});
 await page.goto('/');
 await page.locator('#file').setInputFiles({name:'family.csv',mimeType:'text/csv',buffer:Buffer.from('\uFEFF日期,年份,標題,摘要,分類\r\n09-21,2010,搬家,"第一行\n第二行,合照",家族\r\n')});
 await page.locator('#convert').click();
 await expect(page.locator('#count')).toHaveText('1 則紀事');
 expect(JSON.parse(await page.locator('#output').inputValue())[0]).toMatchObject({date:'09-21',year:2010,region:'家族',summary:'第一行\n第二行,合照'});
 const pending=page.waitForEvent('download');await page.locator('#download').click();const file=await pending;
 expect(file.suggestedFilename()).toBe('history-personal.json');
 const stream=await file.createReadStream();let raw='';for await(const part of stream)raw+=part;expect(JSON.parse(raw)).toHaveLength(1);
 await page.locator('#category').selectOption('家族');await expect(page.locator('#download')).toBeDisabled();
 expect(external).toEqual([]);
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/pages-mobile.png',fullPage:true});
});

test('reads XLSX sheets and Excel dates and renders user content as text',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>!!window.XLSX);
 const bytes=await page.evaluate(()=>{
  const book=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['date','title','summary'],[new Date(2024,1,29),'閏日','紀念']]),'日期');
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['date','year','title','summary'],['09-21',2000,'<img src=x onerror=alert(1)>','私人內容']]),'故事');
  return Array.from(XLSX.write(book,{bookType:'xlsx',type:'array'}).byteLength ? new Uint8Array(XLSX.write(book,{bookType:'xlsx',type:'array'})):[]);
 });
 await page.locator('#file').setInputFiles({name:'events.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(bytes)});
 await page.locator('#convert').click();await expect(page.locator('#count')).toHaveText('1 則紀事');
 expect(JSON.parse(await page.locator('#output').inputValue())[0]).toMatchObject({date:'02-29',year:2024});
 await page.locator('#sheet').selectOption('故事');await expect(page.locator('#download')).toBeDisabled();
 await page.locator('#convert').click();expect(JSON.parse(await page.locator('#output').inputValue())[0].title).toContain('<img');await expect(page.locator('img')).toHaveCount(0);
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/pages-desktop.png',fullPage:true});
});
