import { Solar } from 'lunar-typescript';
import type { taipeiDate } from './gregorian';
export function lunarDate(date: ReturnType<typeof taipeiDate>) {
  const lunar = Solar.fromYmd(date.year, date.month, date.day).getLunar();
  const monthNumber = Math.abs(lunar.getMonth());
  const month = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][monthNumber - 1];
  const alias = monthNumber === 1 ? '（正月）' : monthNumber === 11 ? '（冬月）' : monthNumber === 12 ? '（臘月）' : '';
  return { lunar, text: `${lunar.getYearInGanZhi()}年・${lunar.getMonth() < 0 ? '閏' : ''}${month}月${alias}${lunar.getDayInChinese()}` };
}
