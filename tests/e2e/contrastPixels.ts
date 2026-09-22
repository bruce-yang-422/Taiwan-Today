import { expect, type Page } from '@playwright/test';

/** Sample the rendered background underneath text, including gradients and SVG art.
 * Hide glyphs only while capturing the background; use the original computed ink.
 * This supplements axe's manual-review results for the main new-tab surface.
 */
export async function checkDecoratedText(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const samples = await page.evaluate(() => {
    const samples: { text: string; color: number[]; opacity: number; threshold: number;
      rects: { x: number; y: number; width: number; height: number }[] }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || parent.closest('script,style,dialog,[aria-hidden=true]')) continue;
      if (!parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const css = getComputedStyle(parent);
      if (css.clip !== 'auto' || !/[\p{L}\p{N}]/u.test(node.textContent)) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      const box = parent.getBoundingClientRect();
      // Font ascender/descender boxes may extend past the element's line box.
      // Clip to its content surface so an adjacent divider is not mistaken for ink background.
      const rects = [...range.getClientRects()].map(r => {
        const left = Math.max(r.left, box.left + parseFloat(css.borderLeftWidth || '0'));
        const top = Math.max(r.top, box.top + parseFloat(css.borderTopWidth || '0'));
        const right = Math.min(r.right, box.right - parseFloat(css.borderRightWidth || '0'));
        const bottom = Math.min(r.bottom, box.bottom - parseFloat(css.borderBottomWidth || '0'));
        return { x: left + scrollX, y: top + scrollY, width: right - left, height: bottom - top };
      }).filter(r => r.width > 0 && r.height > 0);
      let opacity = 1;
      for (let el: Element | null = parent; el; el = el.parentElement) opacity *= Number(getComputedStyle(el).opacity);
      const color = (parent instanceof SVGElement ? css.fill : css.color).match(/[\d.]+/g)?.map(Number);
      if (!color || !rects.length) continue;
      samples.push({ text: `${parent.id || parent.className || parent.tagName}: ${node.textContent.trim().slice(0, 35)}`,
        color, opacity, threshold: parseFloat(css.fontSize) >= 24 ||
          (parseFloat(css.fontSize) >= 18.667 && parseInt(css.fontWeight) >= 700) ? 3 : 4.5, rects });
    }
    for (const input of document.querySelectorAll<HTMLInputElement>('input[placeholder]')) {
      if (input.value || input.disabled || !input.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const css = getComputedStyle(input, '::placeholder');
      const color = css.color.match(/[\d.]+/g)?.map(Number);
      if (!color) continue;
      let opacity = Number(css.opacity);
      for (let el: Element | null = input; el; el = el.parentElement) opacity *= Number(getComputedStyle(el).opacity);
      const r = input.getBoundingClientRect();
      samples.push({ text: `placeholder: ${input.id}`, color, opacity, threshold: 4.5,
        rects: [{ x: r.x + scrollX + 4, y: r.y + scrollY + 4, width: r.width - 8, height: r.height - 8 }] });
    }
    return samples;
  });
  const hiddenInk = await page.addStyleTag({ content: '* { color:transparent!important; text-shadow:none!important; } svg text { fill:transparent!important; } input::placeholder { color:transparent!important; }' });
  let png: Buffer;
  try { png = await page.screenshot({ fullPage: true, animations: 'disabled' }); }
  finally { await hiddenInk.evaluate(el => el.parentNode?.removeChild(el)); }
  const result = await page.evaluate(async ({ samples, data }) => {
    const img = new Image(); img.src = data; await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
    const lum = (rgb: number[]) => rgb.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
      .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    return samples.map(sample => {
      let minimum = Infinity;
      for (const r of sample.rects) {
        for (let y = Math.max(0, Math.ceil(r.y + 1)); y < Math.min(img.height, r.y + r.height - 1); y += 2) {
          for (let x = Math.max(0, Math.ceil(r.x + 1)); x < Math.min(img.width, r.x + r.width - 1); x += 2) {
            const offset = (y * img.width + x) * 4;
            const bg = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
            const alpha = (sample.color[3] ?? 1) * sample.opacity;
            const fg = bg.map((v, i) => sample.color[i] * alpha + v * (1 - alpha));
            const a = lum(bg), b = lum(fg);
            minimum = Math.min(minimum, (Math.max(a, b) + .05) / (Math.min(a, b) + .05));
          }
        }
      }
      return { text: sample.text, minimum, threshold: sample.threshold };
    });
  }, { samples, data: `data:image/png;base64,${png.toString('base64')}` });
  expect(result.filter(r => r.minimum < r.threshold), 'Text over rendered backgrounds').toEqual([]);
  return result;
}
