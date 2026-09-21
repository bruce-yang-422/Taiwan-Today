import { normalizeHistorySources, historyDatasets } from '../src/calendar/history';
import { describe, expect, it } from 'vitest';
import { dailyCalendar } from '../src/calendar/dailyCalendar';
import { normalizeUrl, searchUrl } from '../src/search/search';
import { parseShortcuts } from '../src/shortcuts/shortcuts';
import reference from '../data/calendar-2026.json';
import reference2027 from '../data/calendar-2027.json';
import { Lunar } from 'lunar-typescript';
import { bundledFiles, parsePublicData } from '../src/data/publicData';
import { parseManifest } from '../src/data/updates';
import { parsePersonalHistory } from '../src/calendar/personalHistory';
import { unwrapData } from '../src/data/document';
import { parsePersonalHistoryFile } from '../src/calendar/personalHistoryFile';

describe('personal history file import', () => {
  it('reads UTF-8 CSV with quoted commas, multiline text and custom categories', () => {
    const result = parsePersonalHistoryFile('events.CSV', '\uFEFF日期,年份,標題,摘要,分類\r\n09-21,2020,紀念,"第一行,合照\n第二行",小明\r\n');
    expect(result[0]).toMatchObject({ date: '09-21', year: 2020, summary: '第一行,合照\n第二行', region: '小明' });
    expect(parsePersonalHistoryFile('backup.json', JSON.stringify(result))).toEqual(result);
    expect(parsePersonalHistoryFile('backup.json', JSON.stringify({ version: '1.0.0', data: result }))).toEqual(result);
  });
  it('rejects invalid CSV without returning a partial import', () => {
    const header = 'date,year,title,summary\n';
    expect(() => parsePersonalHistoryFile('bad.csv', header + '09-21,2020,a,b\n02-30,2020,c,d')).toThrow('日期不存在');
    expect(() => parsePersonalHistoryFile('bad.csv', header + '09-21,2020,a,"unclosed')).toThrow('CSV 格式');
    expect(() => parsePersonalHistoryFile('bad.csv', header + '09-21,2020,a,\uFFFD')).toThrow('編碼');
    expect(() => parsePersonalHistoryFile('empty.csv', header)).toThrow();
    expect(() => parsePersonalHistoryFile('book.xlsx', '')).toThrow('CSV 或 JSON');
  });
});

describe('public data updates', () => {
  it('accepts custom personal categories with bounded length and preserves public categories', () => {
    const entry = { date: '09-21', year: 2020, title: '紀念', summary: '私人紀事' };
    for (const region of ['童年', '中年', '某某公司', '小明', '台灣', '國際']) {
      expect(parsePersonalHistory([{ ...entry, region }])[0].region).toBe(region);
    }
    expect(parsePersonalHistory([{ ...entry, region: '' }])[0].region).toBe('個人');
    expect(() => parsePersonalHistory([{ ...entry, region: '字'.repeat(41) }])).toThrow();
    expect(() => parsePublicData({ ...bundledFiles, 'history-taiwan.json': [{ ...entry, region: '小明', sourceUrl: 'https://example.com/' }] })).toThrow();
  });
  it('reads versioned documents and legacy payloads identically', () => {
    const legacy = Object.fromEntries(Object.entries(bundledFiles).map(([name, value]) => [name, unwrapData(value)]));
    expect(parsePublicData(bundledFiles)).toEqual(parsePublicData(legacy));
    expect(parsePersonalHistory({ version: '2.3.0', data: [] })).toEqual([]);
    expect(parsePersonalHistory([])).toEqual([]);
    expect(() => parsePersonalHistory({ version: 'invalid', data: [] })).toThrow('資料版本');
    expect(() => parsePublicData({ ...bundledFiles, 'quotes.json': { version: 'invalid', data: [] } })).toThrow('資料版本');
  });
  it('accepts a complete future leap year and rejects missing days', () => {
    const days: Record<string, unknown> = {};
    for (let time = Date.UTC(2028, 0, 1); time < Date.UTC(2029, 0, 1); time += 86400000) {
      days[new Date(time).toISOString().slice(0, 10)] = { lunar: '測試農曆', isDayOff: true };
    }
    const files = { ...bundledFiles, 'calendar-2028.json': { year: 2028, days } };
    expect(parsePublicData(files).calendars['2028-02-29'].isDayOff).toBe(true);
    delete days['2028-02-29'];
    expect(() => parsePublicData(files)).toThrow('年度日曆不完整');
  });
  it('rejects private data, code and paths in remote manifests', () => {
    for (const name of ['history-personal.json', '../quotes.json', 'newtab.js', 'https://example.com/quotes.json']) {
      expect(() => parseManifest({ schemaVersion: 1, revision: 'a'.repeat(64), files: [{ name, bytes: 10, sha256: 'b'.repeat(64) }] })).toThrow();
    }
  });
});
describe('Taiwan calendar', () => {
  it('shows folk observances together without treating them as public holidays', () => {
    const onLunar = (month: number, day: number) => {
      const solar = Lunar.fromYmd(2027, month, day).getSolar();
      return dailyCalendar(new Date(`${solar.toYmd()}T12:00:00+08:00`));
    };
    expect(onLunar(2, 2).festivals).toContain('頭牙（福德正神千秋）');
    expect(onLunar(3, 23).festivals).toContain('天上聖母聖誕（媽祖生）');
    expect(onLunar(3, 23).holiday).toBeUndefined();
    expect(onLunar(7, 15).festivals).toEqual(['中元節', '中元地官大帝聖誕']);
    expect(onLunar(8, 15).festivals).toEqual(['中秋節', '月下老人聖誕']);
    expect(onLunar(12, 16).festivals).toContain('尾牙');
    expect(onLunar(12, 24).festivals).toContain('送神日');
    const leap = Lunar.fromYmd(2025, -6, 6).getSolar();
    expect(dailyCalendar(new Date(`${leap.toYmd()}T12:00:00+08:00`)).festivals).not.toContain('虎爺聖誕');
  });
  it('supports the official 2027 calendar and recurring festival rules', () => {
    expect(Object.keys(reference2027.data.days)).toHaveLength(365);
    expect(Object.values(reference2027.data.days).filter(day => day.isDayOff)).toHaveLength(121);
    expect(Object.values(reference2027.data.days).filter(day => day.solarTerm)).toHaveLength(24);
    const on = (date: string) => dailyCalendar(new Date(`${date}T12:00:00+08:00`));
    expect(on('2027-01-01').holiday).toBe('中華民國開國紀念日（元旦）放假');
    expect(on('2027-02-04').holiday).toBe('除夕前一日（小年夜）放假');
    expect(on('2027-09-28').holiday).toBe('孔子誕辰紀念日／教師節放假');
    expect(on('2027-03-12')).toMatchObject({ isDayOff: false });
    expect(on('2027-03-12').holiday).toBeUndefined();
    expect(on('2027-02-06').festivals).toContain('春節');
    expect(on('2027-02-05').festivals).toContain('除夕');
    expect(on('2027-06-09').festivals).toContain('端午節');
    expect(on('2027-09-15').festivals).toContain('中秋節');
    expect(on('2027-04-05').festivals).toContain('清明節');
    expect(on('2027-10-25').festivals).toContain('臺灣光復暨金門古寧頭大捷紀念日');
    expect(on('2027-02-10')).toMatchObject({ holiday: '春節補假', longHoliday: '除夕及春節連假 7 / 7 天' });
    expect(on('2027-04-06').holiday).toBe('兒童節補假');
    expect(on('2027-12-31')).toMatchObject({ holiday: '2028 年元旦補假', longHoliday: '2028 年元旦連假 1 / 3 天' });
  });
  it('integrates reviewed CSV data and both official appendices', () => {
    expect(Object.keys(reference.data.days)).toHaveLength(365);
    expect(Object.values(reference.data.days).filter(day => day.isDayOff)).toHaveLength(120);
    expect(Object.values(reference.data.days).filter(day => day.solarTerm)).toHaveLength(24);
    expect(dailyCalendar(new Date('2026-01-01T12:00:00+08:00'))).toMatchObject({ isDayOff: true, holiday: '元旦放假' });
    expect(dailyCalendar(new Date('2026-09-28T12:00:00+08:00'))).toMatchObject({ holiday: '教師節放假', longHoliday: '中秋節及教師節連假 4 / 4 天' });
    expect(dailyCalendar(new Date('2026-02-14T12:00:00+08:00')).longHoliday).toBe('除夕及春節連假 1 / 9 天');
  });
  it('uses Taiwan midnight regardless of the host timezone', () => {
    expect(dailyCalendar(new Date('2026-09-20T15:59:59Z')).key).toBe('2026-09-20');
    const today = dailyCalendar(new Date('2026-09-20T16:00:00Z'));
    expect(today.key).toBe('2026-09-21'); expect(today.weekday).toBe('星期一');
    expect(today.lunar).toContain('八月十一'); expect(today.terms).toMatchObject({ current: '白露', next: '秋分', days: 2 });
    expect(today.history[0].year).toBe(1999);
  });
  it('handles term day and year rollover', () => {
    expect(dailyCalendar(new Date('2026-09-23T00:00:00+08:00')).terms).toMatchObject({ current: '秋分', today: '秋分', progress: 0 });
    const next = dailyCalendar(new Date('2026-12-31T23:59:00+08:00')).terms;
    expect(next.current).toBe('冬至'); expect(next.next).toBe('小寒'); expect(next.days).toBeGreaterThan(0);
  });
  it('handles lunar new year, eve, leap months and festivals', () => {
    expect(dailyCalendar(new Date('2026-02-16T12:00:00+08:00')).festivals).toContain('除夕');
    expect(dailyCalendar(new Date('2026-02-17T12:00:00+08:00')).festivals).toContain('春節');
    expect(dailyCalendar(new Date('2025-07-25T12:00:00+08:00')).lunar).toContain('閏六月初一');
    expect(dailyCalendar(new Date('2026-09-25T12:00:00+08:00')).festivals).toContain('中秋節');
    expect(dailyCalendar(new Date('2026-04-05T12:00:00+08:00')).festivals).toContain('清明節');
  });
  it('does not invent history or future holiday schedules', () => {
    expect(dailyCalendar(new Date('2026-08-22T12:00:00+08:00')).history).toEqual([]);
    const past = dailyCalendar(new Date('1998-09-21T12:00:00+08:00')).history;
    expect(past.length).toBeGreaterThan(0);
    expect(past.every(event => event.year <= 1998)).toBe(true);
    expect(dailyCalendar(new Date('2028-06-01T12:00:00+08:00')).holiday).toBeUndefined();
  });
});
describe('safe navigation and storage', () => {
  it('encodes search text and normalizes website URLs', () => {
    expect(new URL(searchUrl(' 台灣 & 日曆 ')).searchParams.get('q')).toBe('台灣 & 日曆');
    expect(normalizeUrl('example.com')).toBe('https://example.com/');
    for (const bad of ['javascript:alert(1)', 'data:text/html,hi', 'file:///C:/x', 'https://user:pass@example.com', 'https://']) expect(() => normalizeUrl(bad)).toThrow();
  });
  it('preserves intentional empty shortcuts and refuses corrupt data', () => {
    expect(parseShortcuts([])).toEqual([]); expect(parseShortcuts(undefined)).toHaveLength(4);
    expect(() => parseShortcuts([{ id: 'x', name: 'x', url: 'javascript:alert(1)', order: 0 }])).toThrow();
    expect(() => parseShortcuts({})).toThrow();
  });
});


describe('history source preferences', () => {
  it('normalizes ordering, duplicates and future topic defaults', () => {
    const datasets = [...historyDatasets, { id: 'sports', label: '體育', kind: 'topic' as const, entries: [] }];
    expect(normalizeHistorySources([{ id: 'world', enabled: false }, { id: 'world', enabled: true }, { id: 'unknown', enabled: true }, null], datasets)).toEqual([
      { id: 'world', enabled: false }, { id: 'personal', enabled: true }, { id: 'taiwan', enabled: true },
      { id: 'tech', enabled: false }, { id: 'entertainment', enabled: false }, { id: 'sports', enabled: false },
    ]);
    expect(normalizeHistorySources(null).map(s => s.id)).toEqual(['personal', 'taiwan', 'world', 'tech', 'entertainment']);
  });
});
