import { readFile, writeFile, mkdir } from 'node:fs/promises';

// Run explicitly when updating the catalog; builds use the checked-in assets.
const databaseUrl = new URL('../data/websites.json', import.meta.url);
const original = await readFile(databaseUrl, 'utf8');
const database = JSON.parse(original);
const directory = new URL('../public/icons/websites/', import.meta.url);
await mkdir(directory, { recursive: true });
const bundled = {
  google: 'google/search.webp', youtube: 'youtube.png', gemini: 'google/gemini.png',
  gmail: 'google/gmail.webp', drive: 'google/drive.webp', docs: 'google/docs.webp',
  maps: 'google/maps.webp', notebooklm: 'google/notebook-symbol.svg',
  pchome: 'pchome.ico', github: 'github.ico',
};
const sources = [];
const direct = {
  threads: 'https://www.threads.com/favicon.ico',
  kkbox: 'https://www.kkbox.com/favicon.ico',
  books: 'https://im1.book.com.tw/favicon.ico',
  copilot: 'https://copilot.microsoft.com/favicon.ico',
};
const sites = database.categories.flatMap(category => category.sites);
for (const site of sites) {
  if (bundled[site.id]) {
    site.icon = `icons/${bundled[site.id]}`;
    sources.push(`| ${site.name} | ${site.icon} | Existing bundled asset; see ../SOURCES.md or ../google/SOURCES.md |`);
    continue;
  }
  const source = direct[site.id] || `https://icons.duckduckgo.com/ip3/${new URL(site.url).hostname}.ico`;
  const response = await fetch(source, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${site.id}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const ico = bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0;
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const webp = new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  if ((!ico && !png && !webp) || bytes.length > 5 * 1024 * 1024) throw new Error(`${site.id}: invalid icon`);
  const filename = `${site.id}.${ico ? 'ico' : png ? 'png' : 'webp'}`;
  await writeFile(new URL(filename, directory), bytes);
  site.icon = `icons/websites/${filename}`;
  sources.push(`| ${site.name} | ${filename} | ${source} |`);
  console.log(`${site.id}: ${bytes.length} bytes`);
}
// Only update catalog references after every download has succeeded.
const icons = new Map(sites.map(site => [site.id, site.icon]));
await writeFile(databaseUrl, original.replace(/\{ "id": [^\r\n]+? \}/g, line => {
  const site = JSON.parse(line);
  if (!icons.has(site.id)) return line;
  delete site.icon;
  const content = line.replace(/, "icon": "[^"]+"/, '').slice(0, -2);
  return `${content}, "icon": ${JSON.stringify(icons.get(site.id))} }`;
}));
await writeFile(new URL('SOURCES.md', directory), `# 常用網站圖示來源\n\n取得日期：${new Date().toISOString().slice(0, 10)}。網站 favicon 從官方網站或透過 DuckDuckGo 圖示服務預先下載，隨擴充功能離線提供；商標與圖像權利屬於各網站權利人。執行 scripts/prepare-website-icons.mjs 可更新。\n\n| 網站 | 檔案 | 來源 |\n| --- | --- | --- |\n${sources.join('\n')}\n`);
