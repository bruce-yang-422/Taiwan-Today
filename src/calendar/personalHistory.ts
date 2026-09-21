import type { HistoryEntry } from './history';
import { unwrapData } from '../data/document';

export function parsePersonalHistory(value: unknown): HistoryEntry[] {
  value = unwrapData(value);
  if (!Array.isArray(value) || value.length > 10000) throw new Error('JSON 必須是陣列，最多 10,000 筆紀事。');
  const seen = new Set<string>();
  return value.map((raw, index) => {
    const fail = (message: string): never => { throw new Error(`第 ${index + 1} 筆：${message}`); };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('紀事格式錯誤。');
    const text = (key: string, max: number, required = false) => {
      const v = raw[key];
      if (v === undefined && !required) return '';
      if (typeof v !== 'string' || v.length > max || (required && !v.trim())) return fail(`${key} 格式錯誤或超過 ${max} 字。`);
      return v.trim();
    };
    const date = text('date', 5, true), year = raw.year;
    if (!Number.isInteger(year) || year < 1 || year > 9999 || !/^\d{2}-\d{2}$/.test(date)) return fail('請提供西元年份及 MM-DD 日期。');
    const stamp = `${String(year).padStart(4, '0')}-${date}`;
    const day = new Date(`${stamp}T00:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== stamp) return fail('日期不存在，請確認閏年與月份。');
    const title = text('title', 200, true), summary = text('summary', 5000, true);
    const region = text('region', 40) || '個人';
    const sourceUrl = text('sourceUrl', 2048);
    if (sourceUrl) {
      try { const url = new URL(sourceUrl); if (url.protocol !== 'https:' || url.username || url.password) return fail('來源網址須為不含帳密的 HTTPS 網址。'); }
      catch { return fail('來源網址須為不含帳密的 HTTPS 網址。'); }
    }
    const key = `${date}|${year}|${title}`;
    if (seen.has(key)) return fail('相同日期、年份與標題重複。');
    seen.add(key);
    const tags = raw.tags;
    if (tags !== undefined && (!Array.isArray(tags) || tags.length > 30 || tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 60))) return fail('tags 必須是最多 30 個短標籤的陣列。');
    return { date, year, title, summary, region, keyword: text('keyword', 500), source: text('source', 200) || '私人紀事', sourceUrl, ...(tags ? { tags: [...tags] } : {}) };
  });
}
