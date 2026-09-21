export function taipeiDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const year = Number(part('year')), month = Number(part('month')), day = Number(part('day'));
  return { year, month, day, key: `${part('year')}-${part('month')}-${part('day')}`, monthDay: `${part('month')}-${part('day')}`, weekday: `星期${'日一二三四五六'[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]}` };
}
export const dateNumber = (ymd: string) => Date.parse(`${ymd}T00:00:00+08:00`) / 86400000;
