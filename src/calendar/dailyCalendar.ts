import festivals from '../../data/festivals.json';
import holidays from '../../data/holidays.json';
import history, { historyDatasets, composeHistory, type HistoryEntry } from './history';
import calendar2026 from '../../data/calendar-2026.json';
import calendar2027 from '../../data/calendar-2027.json';
import { taipeiDate } from './gregorian';
import { lunarDate } from './lunar';
import { solarTerms } from './solarTerms';
const historyIndex = new Map<string, typeof history>();
for (const item of history) historyIndex.set(item.date, [...(historyIndex.get(item.date) ?? []), item]);
export function setPersonalHistory(entries: readonly HistoryEntry[] | undefined) {
  const datasets = historyDatasets.map(dataset => dataset.id === 'personal' && entries !== undefined ? { ...dataset, entries } : dataset);
  historyIndex.clear();
  for (const item of composeHistory(datasets)) historyIndex.set(item.date, [...(historyIndex.get(item.date) ?? []), item]);
}
export function dailyCalendar(now = new Date()) {
  const date = taipeiDate(now), { lunar, text } = lunarDate(date), terms = solarTerms(lunar, date.key);
  const calendar = date.year === 2026 ? calendar2026 : date.year === 2027 ? calendar2027 : undefined;
  const reference = (calendar?.days as Record<string, { lunar: string; solarTerm: string; isDayOff: boolean; holiday: string; longHoliday?: string; holidayDayIndex?: number; holidayDays?: number }> | undefined)?.[date.key];
  const lunarKey = `${String(lunar.getMonth()).padStart(2, '0')}-${String(lunar.getDay()).padStart(2, '0')}`;
  const labels = festivals.filter(f => f.calendar === 'solar' ? f.date === date.monthDay : lunar.getMonth() > 0 && f.date === lunarKey).flatMap(f => [f.name, ...(f.observances ?? [])]);
  if (terms.today === '清明') labels.push('清明節');
  const tomorrow = lunar.next(1);
  if (tomorrow.getMonth() === 1 && tomorrow.getDay() === 1) labels.push('除夕');
  if (date.month === 5 && date.day >= 8 && date.day <= 14 && date.weekday === '星期日') labels.push('母親節');
  const holiday = reference?.holiday || (holidays.dates as Record<string, string>)[date.key];
  return { ...date, lunar: reference ? `${lunar.getYearInGanZhi()}年・${reference.lunar}` : text, terms, festivals: labels, holiday, longHoliday: reference?.longHoliday ? `${reference.longHoliday}連假 ${reference.holidayDayIndex} / ${reference.holidayDays} 天` : undefined, isDayOff: reference?.isDayOff, history: (historyIndex.get(date.monthDay) ?? []).filter(item => item.year <= date.year).slice(0, 3) };
}
