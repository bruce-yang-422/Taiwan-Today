import { allowedFile, REQUIRED_FILES, parsePublicData, type PublicData } from './publicData';

export const DATA_URL = 'https://raw.githubusercontent.com/bruce-yang-422/Taiwan-Today/main/data/';
export const CACHE_KEY = 'publicDataCache';
export interface DataManifest { schemaVersion: 1; revision: string; files: { name: string; sha256: string; bytes: number }[] }
export interface DataCache { schemaVersion: 1; revision: string; updatedAt: string; files: Record<string, unknown> }
export function parseManifest(value: unknown): DataManifest {
  const m = value as DataManifest | null;
  if (!m || m.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(m.revision) || !Array.isArray(m.files) || m.files.length > 40) throw new Error('更新清單格式不支援');
  const seen = new Set<string>(); let size = 0;
  for (const file of m.files) {
    if (!file || typeof file.name !== 'string' || !allowedFile(file.name) || seen.has(file.name) || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isInteger(file.bytes) || file.bytes < 1 || file.bytes > 2 * 1024 * 1024) throw new Error('更新清單包含無效檔案');
    seen.add(file.name); size += file.bytes;
  }
  if (REQUIRED_FILES.some(name => !seen.has(name)) || size > 5 * 1024 * 1024) throw new Error('更新檔案不完整或超過 5 MB');
  return m;
}
export function parseCache(value: unknown): { cache: DataCache; data: PublicData } {
  const c = value as DataCache | null;
  if (!c || c.schemaVersion !== 1 || !/^[a-f0-9]{64}$/.test(c.revision) || !Number.isFinite(Date.parse(c.updatedAt)) || !c.files || typeof c.files !== 'object' || Array.isArray(c.files)) throw new Error('本機更新快取格式錯誤');
  return { cache: c, data: parsePublicData(c.files) };
}
async function download(name: string, maxBytes: number, revision = '') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${DATA_URL}${name}${revision ? `?v=${revision}` : ''}`, { signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' });
    if (!response.ok || !response.body) throw new Error(`無法取得 ${name}（HTTP ${response.status}）`);
    const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error(`${name} 超過大小限制`); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return bytes;
  } finally { clearTimeout(timeout); }
}
export async function fetchPublicUpdate(currentRevision?: string) {
  const decode = (bytes: Uint8Array) => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const manifest = parseManifest(decode(await download('update-manifest.json', 32768)));
  if (manifest.revision === currentRevision) return null;
  const files: Record<string, unknown> = {};
  // Fetch sequentially to bound memory and stop immediately on a bad file.
  for (const file of manifest.files) {
    const bytes = await download(file.name, file.bytes, manifest.revision);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)), b => b.toString(16).padStart(2, '0')).join('');
    if (bytes.byteLength !== file.bytes || hash !== file.sha256) throw new Error(`${file.name} 版本驗證失敗，請稍後重試`);
    files[file.name] = decode(bytes);
  }
  const data = parsePublicData(files);
  const cache: DataCache = { schemaVersion: 1, revision: manifest.revision, updatedAt: new Date().toISOString(), files };
  return { cache, data };
}
