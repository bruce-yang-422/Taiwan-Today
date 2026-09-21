import { describe, expect, it } from 'vitest';
import { dailyCalendar } from '../src/calendar/dailyCalendar';
import { normalizeUrl, searchUrl } from '../src/search/search';
import { parseShortcuts } from '../src/shortcuts/shortcuts';
import reference from '../data/calendar-2026.json';
describe('Taiwan calendar', () => {
  it('integrates reviewed CSV data and both official appendices', () => {
    expect(Object.keys(reference.days)).toHaveLength(365);
    expect(Object.values(reference.days).filter(day => day.isDayOff)).toHaveLength(120);
    expect(Object.values(reference.days).filter(day => day.solarTerm)).toHaveLength(24);
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
    expect(dailyCalendar(new Date('2027-01-01T12:00:00+08:00')).holiday).toBeUndefined();
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
