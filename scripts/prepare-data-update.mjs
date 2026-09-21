import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../data/', import.meta.url);
const required = ['history-taiwan.json', 'history-world.json', 'quotes.json', 'festivals.json', 'holidays.json', 'long-holidays.json'];
const names = (await readdir(root)).filter(name => required.includes(name) || /^calendar-(19\d{2}|20\d{2}|2100)\.json$/.test(name)).sort();
if (required.some(name => !names.includes(name))) throw new Error('缺少公共資料檔案');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function previous(name) {
  try { return JSON.parse(await readFile(new URL(name, root), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
const oldVersions = await previous('versions.json');
const oldManifest = await previous('update-manifest.json');
const now = new Date().toISOString();
const bump = version => /^\d+\.\d+\.\d+$/.test(version ?? '') ? version.replace(/\d+$/, n => String(Number(n) + 1)) : '1.0.0';
const versions = {};
const files = [];
for (const name of [...names, 'history-personal.json']) {
  // Match GitHub's LF checkout even when the local checkout uses CRLF.
  const content = (await readFile(new URL(name, root), 'utf8')).replace(/\r\n/g, '\n');
  JSON.parse(content);
  const bytes = Buffer.from(content);
  if (bytes.length > 2 * 1024 * 1024) throw new Error(`${name} 超過 2 MB`);
  const sha256 = hash(bytes), old = oldVersions?.files?.[name];
  versions[name] = old?.sha256 === sha256 ? old : { version: bump(old?.version), updatedAt: now, sha256 };
  if (name !== 'history-personal.json') files.push({ name, sha256, bytes: bytes.length });
}
if (files.length > 40 || files.reduce((sum, f) => sum + f.bytes, 0) > 5 * 1024 * 1024) throw new Error('更新資料超過上限');
const revision = hash(JSON.stringify(files));
const same = oldManifest?.revision === revision && oldManifest?.version;
const manifest = {
  schemaVersion: 1, version: same ? oldManifest.version : bump(oldManifest?.version),
  updatedAt: same ? oldManifest.updatedAt : now, revision,
  files: files.map(file => ({ ...file, version: versions[file.name].version, updatedAt: versions[file.name].updatedAt })),
};
await writeFile(new URL('versions.json', root), JSON.stringify({ schemaVersion: 1, files: versions }, null, 2) + '\n');
await writeFile(new URL('update-manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`已產生更新清單：${files.length} 個公共 JSON，版本 ${manifest.revision.slice(0, 8)}。請將資料與 update-manifest.json 一起提交並推送。`);
