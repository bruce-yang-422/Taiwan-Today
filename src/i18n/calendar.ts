import type { dailyCalendar } from '../calendar/dailyCalendar';
import { lunarDate } from '../calendar/lunar';
import { getLocale, t } from './index';

export function holidayLabel(value: string): string {
  if (getLocale() === 'zh-TW') return value;
  const match = /^(.*?)(補假|放假)$/.exec(value);
  if (!match) return t(value);
  return t(match[2] === '補假' ? '{0}（補假）' : '{0}（放假）', [t(match[1])]);
}

/** Translate presentation only; source records and Taiwan's calendar rules stay intact. */
export function localizedCalendar(date: ReturnType<typeof dailyCalendar>): ReturnType<typeof dailyCalendar> {
  if (getLocale() === 'zh-TW') return date;
  const lunar = lunarDate(date).lunar;
  const leap = lunar.getMonth() < 0 ? t('閏月') : '';
  const longHoliday = date.longHoliday?.match(/^(.*)連假 (\d+) \/ (\d+) 天$/);
  return {
    ...date,
    lunar: getLocale() === 'en'
      ? `${lunar.getYear()} · ${leap}${Math.abs(lunar.getMonth())}/${lunar.getDay()}`
      : `${lunar.getYearInGanZhi()}年・${leap}${Math.abs(lunar.getMonth())}月${lunar.getDay()}日`,
    terms: { ...date.terms, current: t(date.terms.current), next: t(date.terms.next), today: t(date.terms.today) },
    festivals: date.festivals.map(name => t(name)),
    holiday: date.holiday ? holidayLabel(date.holiday) : date.holiday,
    longHoliday: longHoliday ? t('{0}連假 {1} / {2} 天', [t(longHoliday[1]), longHoliday[2], longHoliday[3]]) : date.longHoliday,
  };
}
