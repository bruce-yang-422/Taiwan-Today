import taiwan from '../../data/history-taiwan.json';
import world from '../../data/history-world.json';
import tech from '../../data/history-tech.json';
import entertainment from '../../data/history-entertainment.json';
import quotes from '../../data/quotes.json';
import festivals from '../../data/festivals.json';
import holidays from '../../data/holidays.json';
import longHolidays from '../../data/long-holidays.json';
import calendar2026 from '../../data/calendar-2026.json';
import calendar2027 from '../../data/calendar-2027.json';
import { parsePersonalHistory } from '../calendar/personalHistory';
import type { HistoryEntry } from '../calendar/history';
import { unwrapData } from './document';

export const REQUIRED_FILES = ['history-taiwan.json', 'history-world.json', 'history-tech.json', 'history-entertainment.json', 'quotes.json', 'festivals.json', 'holidays.json', 'long-holidays.json'];
export const bundledFiles: Record<string, unknown> = {
  'history-taiwan.json': taiwan, 'history-world.json': world,
  'history-tech.json': tech, 'history-entertainment.json': entertainment, 'quotes.json': quotes,
  'festivals.json': festivals, 'holidays.json': holidays, 'long-holidays.json': longHolidays,
  'calendar-2026.json': calendar2026, 'calendar-2027.json': calendar2027,
};
export interface PublicData {
  taiwan: HistoryEntry[]; world: HistoryEntry[]; tech: HistoryEntry[]; entertainment: HistoryEntry[];
  quotes: { id: string; category: string; text: string; source: string }[];
  festivals: { calendar: string; date: string; name: string; observances: string[] }[];
  holidays: Record<string, string>;
  periods: { name: string; start: string; end: string; days: number }[];
  calendars: Record<string, { lunar: string; isDayOff: boolean }>;
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('資料物件格式錯誤');
  return value as Record<string, unknown>;
}
function list(value: unknown, max = 10000): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error('資料筆數或陣列格式錯誤');
  return value;
}
function text(value: unknown, max = 200, empty = false): string {
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new Error('文字欄位格式錯誤');
  return value;
}
function date(value: unknown): string {
  const s = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s) throw new Error('日期格式錯誤');
  return s;
}
export function allowedFile(name: string) {
  return REQUIRED_FILES.includes(name) || /^calendar-(19\d{2}|20\d{2}|2100)\.json$/.test(name);
}
/** Topic packs (e.g. tech, entertainment) share the entry shape but not the region whitelist used for personal imports. */
function parseTopicHistory(value: unknown, region: string): HistoryEntry[] {
  const entries = list(value, 10000).map((raw, index) => {
    const fail = (message: string): never => { throw new Error(`${region} 第 ${index + 1} 筆：${message}`); };
    const e = object(raw);
    const day = text(e.date, 5, true);
    if (!/^\d{2}-\d{2}$/.test(day)) return fail('日期格式錯誤');
    if (!Number.isInteger(e.year) || (e.year as number) <= 0) return fail('年份格式錯誤');
    const year = e.year as number;
    const stamp = new Date(`2000-${day}T00:00:00Z`);
    if (Number.isNaN(stamp.getTime()) || stamp.toISOString().slice(5, 10) !== day) return fail('日期不存在');
    const title = text(e.title, 200, true), summary = text(e.summary, 5000, true);
    if ([...summary].length < 50 || [...summary].length > 100) return fail('摘要須為 50～100 字');
    const sourceUrl = text(e.sourceUrl, 2048, true);
    try { const url = new URL(sourceUrl); if (url.protocol !== 'https:') return fail('來源須為 HTTPS 網址'); }
    catch { return fail('來源須為 HTTPS 網址'); }
    if (e.region !== region) return fail(`region 須為「${region}」`);
    const tags = e.tags;
    if (tags !== undefined && (!Array.isArray(tags) || tags.length > 30 || tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 60))) return fail('tags 必須是最多 30 個短標籤的陣列');
    return { date: day, year, title, summary, region, keyword: text(e.keyword, 500), source: text(e.source, 200, true), sourceUrl, ...(tags ? { tags: [...tags] } : {}) };
  });
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.date}|${entry.year}|${entry.title}`;
    if (seen.has(key)) throw new Error(`${region}：日期、年份與標題重複的紀事`);
    seen.add(key);
  }
  return entries;
}
export function parsePublicData(files: Record<string, unknown>): PublicData {
  files = Object.fromEntries(Object.entries(files).map(([name, value]) => [name, unwrapData(value)]));
  if (REQUIRED_FILES.some(name => !(name in files)) || Object.keys(files).some(name => !allowedFile(name))) throw new Error('更新檔案清單不完整或不支援');
  const history = (name: string, region: string) => {
    const entries = parsePersonalHistory(files[name]);
    if (!entries.length || entries.some(e => e.region !== region || !e.sourceUrl)) throw new Error('公共紀事分類或來源錯誤');
    return entries;
  };
  const ids = new Set<string>();
  const parsedQuotes = list(files['quotes.json']).map(raw => {
    const q = object(raw), id = text(q.id), category = text(q.category);
    if (ids.has(id) || !['daily', 'negative', 'sheng-yen', 'classics', 'famous'].includes(category)) throw new Error('語錄分類或識別碼錯誤');
    ids.add(id); return { id, category, text: text(q.text, 5000), source: text(q.source) };
  });
  if (!parsedQuotes.length) throw new Error('語錄不得為空');
  const parsedFestivals = list(files['festivals.json'], 1000).map(raw => {
    const f = object(raw), calendar = text(f.calendar), day = text(f.date, 5);
    if (!['solar', 'lunar'].includes(calendar) || !/^\d{2}-\d{2}$/.test(day)) throw new Error('節日日期錯誤');
    if (calendar === 'solar') date(`2000-${day}`);
    else if (+day.slice(0, 2) < 1 || +day.slice(0, 2) > 12 || +day.slice(3) < 1 || +day.slice(3) > 30) throw new Error('農曆日期錯誤');
    return { calendar, date: day, name: text(f.name), observances: f.observances === undefined ? [] : list(f.observances, 30).map(v => text(v)) };
  });
  const parsedHolidays: Record<string, string> = {};
  for (const [key, value] of Object.entries(object(object(files['holidays.json']).dates))) parsedHolidays[date(key)] = text(value);
  const periods = list(object(files['long-holidays.json']).periods, 1000).map(raw => {
    const p = object(raw), start = date(p.start), end = date(p.end), days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
    if (days < 3 || days > 31 || p.days !== days) throw new Error('連假天數錯誤');
    return { name: text(p.name), start, end, days };
  }).sort((a, b) => a.start.localeCompare(b.start));
  if (periods.some((p, i) => i > 0 && p.start <= periods[i - 1].end)) throw new Error('連假區間重疊');
  const calendars: PublicData['calendars'] = {};
  for (const [name, raw] of Object.entries(files)) if (name.startsWith('calendar-')) {
    const c = object(raw), year = Number(name.slice(9, 13)), days = object(c.days);
    const expected = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
    if (c.year !== year || Object.keys(days).length !== expected) throw new Error('年度日曆不完整');
    for (const [key, value] of Object.entries(days)) {
      if (!date(key).startsWith(`${year}-`)) throw new Error('日曆年份不符');
      const day = object(value);
      if (typeof day.isDayOff !== 'boolean') throw new Error('放假欄位錯誤');
      calendars[key] = { lunar: text(day.lunar), isDayOff: day.isDayOff };
    }
  }
  return {
    taiwan: history('history-taiwan.json', '台灣'), world: history('history-world.json', '國際'),
    tech: parseTopicHistory(files['history-tech.json'], '科技'), entertainment: parseTopicHistory(files['history-entertainment.json'], '影音娛樂'),
    quotes: parsedQuotes, festivals: parsedFestivals, holidays: parsedHolidays, periods, calendars,
  };
}
let current = parsePublicData(bundledFiles);
const listeners = new Set<() => void>();
export const getPublicData = () => current;
export function applyPublicData(data: PublicData) { current = data; listeners.forEach(fn => fn()); }
export function onPublicDataChange(fn: () => void) { listeners.add(fn); }
