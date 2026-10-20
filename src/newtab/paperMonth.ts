import { t, weekdayName } from '../i18n';
import { holidayLabel } from '../i18n/calendar';
import { getPublicData } from '../data/publicData';

/** Weekends stay red; the local holiday calendar also covers weekday days off. */
export function isPaperRedDay(year: number, month: number, day: number) {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const data = getPublicData();
  return weekday === 0 || weekday === 6 || Boolean(data.holidays[key]) || data.calendars[key]?.isDayOff === true;
}

/** A small, Sunday-first month printed in the corner of the tear-off calendar. */
export function renderPaperMonth(table: HTMLTableElement, date: { year: number; month: number; day: number }) {
  const { year, month, day } = date;
  table.replaceChildren();
  table.setAttribute('aria-label', t("{0} 年 {1} 月月曆", [year, month]));
  table.createCaption().textContent = t("{0} · {1} 月", [year, month]);
  const heading = table.createTHead().insertRow();
  ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((label, index) => {
    const cell = document.createElement('th');
    cell.scope = 'col'; cell.textContent = label;
    if (index === 0 || index === 6) cell.className = 'paper-red-day';
    cell.setAttribute('aria-label', weekdayName(index));
    heading.append(cell);
  });
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const body = table.createTBody();
  for (let index = 0; index < Math.ceil((first + days) / 7) * 7; index++) {
    const row = index % 7 === 0 ? body.insertRow() : body.rows[body.rows.length - 1];
    const cell = row.insertCell();
    const value = index - first + 1;
    if (value < 1 || value > days) continue;
    const time = document.createElement('time');
    time.dateTime = `${year}-${String(month).padStart(2, '0')}-${String(value).padStart(2, '0')}`;
    time.textContent = String(value);
    if (isPaperRedDay(year, month, value)) time.className = 'paper-red-day';
    const holiday = getPublicData().holidays[time.dateTime];
    if (holiday) time.title = holidayLabel(holiday);
    if (value === day) time.setAttribute('aria-current', 'date');
    cell.append(time);
  }
}
