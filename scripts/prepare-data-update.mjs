import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../data/', import.meta.url);
const required = ['history-taiwan.json', 'history-world.json', 'quotes.json', 'festivals.json', 'holidays.json', 'long-holidays.json'];
const names = (await readdir(root)).filter(name => required.includes(name) || /^calendar-(19\d{2}|20\d{2}|2100)\.json$/.test(name)).sort();
if (required.some(name => !names.includes(name))) throw new Error('缺少公共資料檔案');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = [];
for (const name of names) {
  // Match GitHub's LF checkout even when the local checkout uses CRLF.
  const content = (await readFile(new URL(name, root), 'utf8')).replace(/\r\n/g, '\n');
  JSON.parse(content);
  const bytes = Buffer.from(content);
  if (bytes.length > 2 * 1024 * 1024) throw new Error(`${name} 超過 2 MB`);
  files.push({ name, sha256: hash(bytes), bytes: bytes.length });
}
if (files.length > 40 || files.reduce((sum, f) => sum + f.bytes, 0) > 5 * 1024 * 1024) throw new Error('更新資料超過上限');
const manifest = { schemaVersion: 1, revision: hash(JSON.stringify(files)), files };
await writeFile(new URL('update-manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`已產生更新清單：${files.length} 個公共 JSON，版本 ${manifest.revision.slice(0, 8)}。請將資料與 update-manifest.json 一起提交並推送。`);
