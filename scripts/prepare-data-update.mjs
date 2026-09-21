import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../data/', import.meta.url);
const required = ['history-taiwan.json', 'history-world.json', 'history-tech.json', 'history-entertainment.json', 'quotes.json', 'festivals.json', 'holidays.json', 'long-holidays.json'];
const names = (await readdir(root)).filter(name => required.includes(name) || /^calendar-(19\d{2}|20\d{2}|2100)\.json$/.test(name)).sort();
if (required.some(name => !names.includes(name))) throw new Error('缺少公共資料檔案');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function previous(name) {
  try { return JSON.parse(await readFile(new URL(name, root), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
const oldManifest = await previous('update-manifest.json');
const taiwanTime = value => new Date(new Date(value).getTime() + 8 * 60 * 60 * 1000).toISOString().replace('Z', '+08:00');
const now = taiwanTime(new Date());
function validVersion(version, name) {
  if (typeof version !== 'string' || !/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(version)) throw new Error(`${name} 版本須為 x.y.z，例如 1.0.0`);
  return version;
}
const releaseVersion = validVersion(oldManifest?.version ?? '1.0.0', '整批資料');
const versions = {};
const files = [];
const documents = [];
for (const name of [...names, 'history-personal.json']) {
  // Match GitHub's LF checkout even when the local checkout uses CRLF.
  const content = (await readFile(new URL(name, root), 'utf8')).replace(/\r\n/g, '\n');
  const document = JSON.parse(content);
  if (!document || typeof document !== 'object' || Array.isArray(document) || !('data' in document)) throw new Error(`${name} 必須包含 version 與 data`);
  const old = oldManifest?.files?.find(file => file.name === name);
  const unchanged = old?.sha256 === hash(Buffer.from(content));
  // Personal history is a bundled template, never a remote update payload.
  // Its timestamp is maintained in the document because it has no manifest entry.
  const updatedAt = name === 'history-personal.json' || !old
    ? (document.updatedAt ? taiwanTime(document.updatedAt) : now)
    : unchanged && old.updatedAt ? taiwanTime(old.updatedAt) : now;
  const normalized = JSON.stringify({ version: document.version, updatedAt, data: document.data }, null, 2) + '\n';
  const bytes = Buffer.from(normalized);
  if (bytes.length > 2 * 1024 * 1024) throw new Error(`${name} 超過 2 MB`);
  const sha256 = hash(bytes);
  const version = validVersion(document.version, name);
  versions[name] = { version, updatedAt, sha256 };
  if (normalized !== content) documents.push([name, normalized]);
  if (name !== 'history-personal.json') files.push({ name, sha256, bytes: bytes.length });
}
if (files.length > 40 || files.reduce((sum, f) => sum + f.bytes, 0) > 5 * 1024 * 1024) throw new Error('更新資料超過上限');
const publishedFiles = files.map(file => ({ ...file, version: versions[file.name].version, updatedAt: versions[file.name].updatedAt }));
// Version-only edits must also be detected by clients with an existing cache.
const revision = hash(JSON.stringify({ version: releaseVersion, files: publishedFiles }));
const same = oldManifest?.revision === revision;
const manifest = {
  schemaVersion: 1, version: releaseVersion,
  updatedAt: same ? taiwanTime(oldManifest.updatedAt) : now, revision,
  files: publishedFiles,
};
for (const [name, content] of documents) await writeFile(new URL(name, root), content);
await writeFile(new URL('update-manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`已產生更新清單：${files.length} 個公共 JSON，版本 ${manifest.revision.slice(0, 8)}。請將資料與 update-manifest.json 一起提交並推送。`);
