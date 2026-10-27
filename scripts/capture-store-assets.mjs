import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const output = path.resolve('store-assets/chrome-web-store/zh_TW/v1.1.0');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const styles = [
  ['classic', 'dark', '01-classic-dark'],
  ['modern', 'light', '02-modern-light'],
  ['traditional', 'light', '03-traditional-light'],
  ['workspace', 'light', '04-workspace-light'],
  ['reading', 'light', '05-reading-light'],
];
try {
  for (const [style, appearance, name] of styles) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'zh-TW', timezoneId: 'Asia/Taipei', deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-10-27T14:12:00+08:00') });
    await page.addInitScript(({ style, appearance }) => {
      localStorage.setItem('language', JSON.stringify('zh-TW'));
      localStorage.setItem('preferences', JSON.stringify({ style, appearance, quoteCategory: 'daily' }));
      localStorage.setItem('chatgptShortcutAdded', 'true');
      localStorage.setItem('shortcuts', JSON.stringify([
        ['youtube', 'YouTube', 'https://www.youtube.com/'],
        ['yahoo', 'Yahoo 奇摩', 'https://tw.yahoo.com/'],
        ['chatgpt', 'ChatGPT', 'https://chatgpt.com/'],
        ['cwa', '中央氣象署', 'https://www.cwa.gov.tw/'],
        ['github', 'GitHub', 'https://github.com/'],
      ].map(([id, name, url], order) => ({ id, name, url, order }))));
      localStorage.setItem('todos', JSON.stringify([
        { id: '1', text: '整理今天的工作筆記', done: true },
        { id: '2', text: '傍晚散步，留點時間給自己', done: false },
      ]));
    }, { style, appearance });
    await page.goto('http://127.0.0.1:4173/newtab.html');
    await page.waitForSelector('html:not([data-loading])');
    await page.locator('#day').waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    await page.waitForTimeout(1200);
    if (style === 'reading') await page.locator('#todo-panel > summary').click();
    await page.screenshot({ path: path.join(output, `screenshot-${name}-1280x800.png`), animations: 'disabled', fullPage: style === 'workspace' });
    console.log(name, await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, errors: document.querySelector('#status')?.textContent })));
    await context.close();
  }

  const dataURL = async file => `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
  const screenshot = await dataURL(path.join(output, 'screenshot-01-classic-dark-1280x800.png'));
  const art = await dataURL('public/art/classic-dark.png');
  const icon = await dataURL('public/icons/taiwan-today.png');
  for (const [width, height, name] of [[440, 280, 'promo-small-440x280'], [1400, 560, 'promo-marquee-1400x560']]) {
    const small = width === 440;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#142638;color:#f7f3e9;font-family:"Microsoft JhengHei",sans-serif}
      .bg{position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,30,45,.94),rgba(15,30,45,.25)),url('${art}') center/cover}
      .copy{position:absolute;left:${small ? 26 : 72}px;top:${small ? 25 : 112}px;z-index:2}
      .brand{display:flex;align-items:center;gap:${small ? 9 : 17}px}.brand img{width:${small ? 30 : 48}px;height:auto}
      h1{font-size:${small ? 29 : 54}px;letter-spacing:2px;margin:0;font-weight:700}
      h2{font-size:${small ? 17 : 29}px;font-weight:400;letter-spacing:1px;margin:${small ? 12 : 28}px 0;color:#ebe4d3}
      p{font-size:${small ? 12 : 18}px;line-height:1.9;color:#c2d1dd;margin:0}
      .screen{position:absolute;${small ? 'width:284px;right:-12px;top:143px' : 'width:762px;right:-46px;top:65px'};border:1px solid #68798b;border-radius:${small ? 7 : 12}px;box-shadow:0 18px 60px #0008;overflow:hidden;background:#1b2b3c;transform:rotate(-3deg)}
      .screen img{width:100%;display:block}
      .tag{position:absolute;left:${small ? 27 : 74}px;bottom:${small ? 24 : 70}px;font-size:${small ? 11 : 14}px;letter-spacing:2px;color:#b8cbd8}
    </style><div class="bg"></div><div class="copy"><div class="brand"><img src="${icon}"><h1>台灣今日曆</h1></div><h2>把今天，留一點給自己。</h2><p>${small ? '農曆節氣・待辦・歷史上的今天' : '開啟新分頁，看見今天的台灣。<br>農曆節氣・今日待辦・歷史上的今天<br>五種樣式，亮暗隨心。'}</p></div><div class="screen"><img src="${screenshot}"></div><div class="tag">CHROME 新分頁日曆</div></html>`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
    await page.screenshot({ path: path.join(output, `${name}.png`) });
    await page.close();
  }
  execFileSync('python', ['-c', `
from PIL import Image, ImageOps
from pathlib import Path
p = Path(${JSON.stringify(output)})
for f in sorted(p.glob('*.png')):
    im = Image.open(f).convert('RGB')
    expected = (1280,800) if f.name.startswith('screenshot-') else ((440,280) if 'small' in f.name else (1400,560))
    if im.size != expected:
        im = ImageOps.pad(im, expected, method=Image.Resampling.LANCZOS, color='#f7faf8')
    im.save(f, optimize=True)
    raw = f.read_bytes()
    assert raw[24] == 8 and raw[25] == 2, 'PNG must be 24-bit RGB without alpha'
    print(f.name, im.size, im.mode, '24-bit PNG verified')
`], { stdio: 'inherit' });
  await writeFile(path.join(output, 'UPLOAD.txt'), '台灣今日曆 v1.1.0 商店素材\n\n在地化螢幕截圖：screenshot- 開頭的 5 張，1280×800。\n小型宣傳圖塊：promo-small-440x280.png。\n跑馬燈宣傳圖塊：promo-marquee-1400x560.png。\n\n截圖使用本版正式建置頁面、繁體中文介面與示範待辦／自訂捷徑；日期為 2026-10-27。\n月序手帖拍攝完整頁面後等比例縮小並補齊左右背景至 1280×800；其餘截圖直接以 1280×800 拍攝。\n宣傳圖由實際截圖、專案內建背景與產品圖示排版。\n所有 PNG 已轉為 RGB 並驗證 PNG 色彩類型 2（24 位元、無 alpha）。\n');
} finally {
  await browser.close();
}
