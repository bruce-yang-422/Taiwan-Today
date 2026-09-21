import { getPublicData, onPublicDataChange } from '../data/publicData';
import history, { historyDatasets, composeHistory, normalizeHistorySources, type HistoryEntry } from './history';
import { taipeiDate } from './gregorian';
import { lunarDate } from './lunar';
import { solarTerms } from './solarTerms';
const historyIndex = new Map<string, typeof history>();
let personalEntries: readonly HistoryEntry[] | undefined;
let sourceSettings = normalizeHistorySources(undefined);
function rebuildHistoryIndex() {
  const datasets = sourceSettings.filter(s => s.enabled).map(s => historyDatasets.find(d => d.id === s.id)!)
    .map(dataset => dataset.id === 'personal' && personalEntries !== undefined ? { ...dataset, entries: personalEntries } : dataset);
  historyIndex.clear();
  for (const item of composeHistory(datasets)) {
    const entries = historyIndex.get(item.date) ?? [];
    entries.push(item); historyIndex.set(item.date, entries);
  }
}
export function setHistorySources(value: unknown) {
  const next = normalizeHistorySources(value);
  if (JSON.stringify(next) === JSON.stringify(sourceSettings)) return false;
  sourceSettings = next; rebuildHistoryIndex(); return true;
}
export function setPersonalHistory(entries: readonly HistoryEntry[] | undefined) {
  personalEntries = entries; rebuildHistoryIndex();
}
rebuildHistoryIndex();
onPublicDataChange(rebuildHistoryIndex);
export function dailyCalendar(now = new Date()) {
  const date = taipeiDate(now), { lunar, text } = lunarDate(date), terms = solarTerms(lunar, date.key);
  const data = getPublicData(), festivals = data.festivals;
  const reference = data.calendars[date.key];
  const period = reference ? data.periods.find(p => date.key >= p.start && date.key <= p.end) : undefined;
  const lunarKey = `${String(lunar.getMonth()).padStart(2, '0')}-${String(lunar.getDay()).padStart(2, '0')}`;
  const labels = festivals.filter(f => f.calendar === 'solar' ? f.date === date.monthDay : lunar.getMonth() > 0 && f.date === lunarKey).flatMap(f => [f.name, ...(f.observances ?? [])]);
  if (terms.today === '清明') labels.push('清明節');
  const tomorrow = lunar.next(1);
  if (tomorrow.getMonth() === 1 && tomorrow.getDay() === 1) labels.push('除夕');
  if (date.month === 5 && date.day >= 8 && date.day <= 14 && date.weekday === '星期日') labels.push('母親節');
  const holiday = data.holidays[date.key];
  return { ...date, lunar: reference ? `${lunar.getYearInGanZhi()}年・${reference.lunar}` : text, terms, festivals: labels, holiday, longHoliday: period ? `${period.name}連假 ${(Date.parse(date.key) - Date.parse(period.start)) / 86400000 + 1} / ${period.days} 天` : undefined, isDayOff: reference?.isDayOff, history: (historyIndex.get(date.monthDay) ?? []).filter(item => item.year <= date.year) };
}
