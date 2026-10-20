import { zonedDate } from './gregorian';

export type CalendarMode = 'taiwan' | 'travel' | 'international';
export interface CalendarContext { mode: CalendarMode; timezone: string; travelClock: 'taiwan' | 'gps' }
export const defaultContext: CalendarContext = { mode: 'taiwan', timezone: 'system', travelClock: 'taiwan' };
let context = { ...defaultContext };
let gpsTimezone: string | undefined;
export const validTimezone = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; } catch { return false; }
};
export function parseContext(value: unknown): CalendarContext {
  const v = value as Partial<CalendarContext> | null;
  return { mode: v?.mode === 'international' || v?.mode === 'travel' ? v.mode : 'taiwan',
    timezone: v?.timezone === 'system' || !validTimezone(v?.timezone) ? 'system' : v.timezone,
    travelClock: v?.travelClock === 'gps' ? 'gps' : 'taiwan' };
}
export const getCalendarContext = () => context;
const changed = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('calendarcontextchange')); };
export function setCalendarContext(value: unknown) {
  const next = parseContext(value);
  if (JSON.stringify(next) === JSON.stringify(context)) return;
  context = next; changed();
}
export function setGpsTimezone(value: string | undefined) {
  const next = validTimezone(value) ? value : undefined;
  if (next === gpsTimezone) return;
  gpsTimezone = next; changed();
}
export const usesTaiwanCalendar = () => context.mode !== 'international';
export function calendarTimezone() {
  return usesTaiwanCalendar() ? 'Asia/Taipei' : context.timezone === 'system' ? Intl.DateTimeFormat().resolvedOptions().timeZone : context.timezone;
}
export function clockTimezone() {
  if (context.mode === 'travel') return context.travelClock === 'gps' ? gpsTimezone : 'Asia/Taipei';
  return calendarTimezone();
}
export const calendarDate = (now = new Date()) => zonedDate(now, calendarTimezone());

/** Noon in the chosen zone, including DST, for clicks on an arbitrary month cell. */
export function calendarNoon(key: string) {
  const target = Date.parse(`${key}T12:00:00Z`);
  let stamp = target;
  const formatter = new Intl.DateTimeFormat('en', { timeZone: calendarTimezone(), year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = formatter.formatToParts(stamp);
    const part = (type: string) => Number(parts.find(p => p.type === type)!.value);
    const local = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
    stamp += target - local;
  }
  return new Date(stamp);
}
