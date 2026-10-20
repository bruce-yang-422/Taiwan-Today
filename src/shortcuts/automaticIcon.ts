import { readStorage, writeStorage } from './storage';
import { importShortcutIcon } from './importIcon';
import { validIcon } from './shortcuts';

interface CachedIcon { icon?: string; checked: number; retryAfter?: number }
const pending = new Map<string, Promise<string | undefined>>();
const cacheKey = 'automaticShortcutIcons';
const day = 86400000;

async function readCache(): Promise<Record<string, CachedIcon>> {
  const stored = await readStorage(cacheKey);
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
  return Object.fromEntries(Object.entries(stored).filter(([, value]) => value && typeof value === 'object' &&
    Number.isFinite(value.checked) && (value.retryAfter === undefined || Number.isFinite(value.retryAfter)) &&
    (value.icon === undefined || validIcon(value.icon))));
}

async function saveCache(origin: string, value: CachedIcon) {
  await navigator.locks.request(cacheKey, async () => {
    const cache = await readCache();
    cache[origin] = value;
    const recent = Object.entries(cache).sort((a, b) => b[1].checked - a[1].checked).slice(0, 100);
    await writeStorage(cacheKey, Object.fromEntries(recent));
  });
}

async function download(url: string, limit: number): Promise<{ bytes: Uint8Array<ArrayBuffer>; url: string; type: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-cache', signal: controller.signal });
    if (!response.ok || !response.body) throw new Error('Icon request failed');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > limit) throw new Error('Icon response too large');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return { bytes, url: response.url || url, type: response.headers.get('content-type') || '' };
  } finally { clearTimeout(timer); }
}

let defaultChromeIcon: Promise<Uint8Array> | undefined;
async function chromeIcon(pageUrl: string): Promise<string | undefined> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) return;
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('size', '32');
  url.searchParams.set('fallbackToHost', '1');
  const read = async (page: string) => {
    url.searchParams.set('pageUrl', page);
    return (await download(url.href, 5 * 1024 * 1024)).bytes;
  };
  try {
    defaultChromeIcon ??= read('https://taiwan-today-no-icon.invalid/').catch(error => { defaultChromeIcon = undefined; throw error; });
    const [bytes, fallback] = await Promise.all([read(pageUrl), defaultChromeIcon]);
    if (bytes.length === fallback.length && bytes.every((byte, i) => byte === fallback[i])) return;
    return await importShortcutIcon(new File([bytes], 'favicon.png'));
  } catch { return; }
}

export function automaticShortcutIcon(pageUrl: string): Promise<string | undefined> {
  const origin = new URL(pageUrl).origin;
  const existing = pending.get(origin);
  if (existing) return existing;
  const task = navigator.locks.request(`automatic-icon:${origin}`, () => resolveIcon(pageUrl, origin))
    .catch(() => undefined).finally(() => pending.delete(origin));
  pending.set(origin, task);
  return task;
}

export async function cachedAutomaticShortcutIcon(pageUrl: string): Promise<string | undefined> {
  try { return (await readCache())[new URL(pageUrl).origin]?.icon; }
  catch { return; }
}

async function resolveIcon(pageUrl: string, origin: string): Promise<string | undefined> {
  const cached = (await readCache())[origin];
  if (cached?.icon && Date.now() - cached.checked < 7 * day) return cached.icon;
  if (cached?.retryAfter && Date.now() < cached.retryAfter) return cached.icon;
  // Refresh only through Chrome's favicon endpoint; no arbitrary website requests.
  if (navigator.onLine === false) return cached?.icon;
  if (cached && !cached.icon && Date.now() - cached.checked < day) return;
  const icon = await chromeIcon(pageUrl);
  if (icon) {
    await saveCache(origin, { icon, checked: Date.now() }).catch(() => {});
    return icon;
  }
  await saveCache(origin, cached?.icon ? { ...cached, retryAfter: Date.now() + day } : { checked: Date.now() }).catch(() => {});
  return cached?.icon;
}
