import { normalizeUrl } from '../search/search';
import { readStorage, writeStorage } from './storage';
export interface Shortcut { id: string; name: string; url: string; order: number; icon?: string }
export const validIcon = (value: unknown): value is string => typeof value === 'string' && value.length <= 90000 && /^data:image\/(png|x-icon|vnd.microsoft.icon);base64,[A-Za-z0-9+/]+=*$/.test(value);
export const defaults: Shortcut[] = [
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/', order: 0 },
  { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/', order: 1 },
  { id: 'yahoo', name: 'Yahoo 奇摩', url: 'https://tw.yahoo.com/', order: 2 },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', order: 3 },
];
export async function loadShortcuts(): Promise<Shortcut[]> {
  return navigator.locks.request('taiwan-today-shortcut-upgrade', async () => {
    const items = parseShortcuts(await readStorage('shortcuts'));
    if (await readStorage('chatgptShortcutAdded')) return items;
    if (!items.some(item => ['chatgpt.com', 'www.chatgpt.com'].includes(new URL(item.url).hostname))) {
      items.push({ id: crypto.randomUUID(), name: 'ChatGPT', url: 'https://chatgpt.com/', order: Math.max(-1, ...items.map(item => item.order)) + 1 });
    }
    await writeStorage('shortcuts', items);
    await writeStorage('chatgptShortcutAdded', true);
    return items;
  });
}
export function shortcutIcon(item: Shortcut): string | undefined {
  if (validIcon(item.icon)) return item.icon;
  const bundled: Record<string, string> = {
    'www.youtube.com': 'youtube.png', 'youtube.com': 'youtube.png',
    '24h.pchome.com.tw': 'pchome.ico', 'github.com': 'github.ico',
  };
  const file = bundled[new URL(item.url).hostname];
  if (file) return `./icons/${file}`;
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    const url = new URL(chrome.runtime.getURL('/_favicon/'));
    url.searchParams.set('pageUrl', item.url);
    url.searchParams.set('size', '32');
    return url.href;
  }
  return undefined;
}
export function parseShortcuts(value: unknown): Shortcut[] {
  if (value === undefined) return structuredClone(defaults);
  if (!Array.isArray(value)) throw new Error('捷徑資料格式有誤');
  const ids = new Set<string>();
  return value.map((s: unknown) => {
    if (!s || typeof s !== 'object') throw new Error('捷徑資料格式有誤');
    const item = s as Shortcut;
    if (typeof item.id !== 'string' || !item.id || ids.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 40 || typeof item.url !== 'string' || !Number.isFinite(item.order)) throw new Error('捷徑資料格式有誤');
    ids.add(item.id);
    return { id: item.id, name: item.name.trim(), url: normalizeUrl(item.url), order: item.order, ...(validIcon(item.icon) ? { icon: item.icon } : {}) };
  }).sort((a, b) => a.order - b.order);
}
