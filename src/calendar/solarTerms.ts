import type { Lunar } from 'lunar-typescript';
import { dateNumber } from './gregorian';
const traditional = (text: string) => text.replace('惊', '驚').replace('蛰', '蟄').replace('谷', '穀').replace('满', '滿').replace('种', '種').replace('处', '處');
export function solarTerms(lunar: Lunar, key: string) {
  // Whole-day comparison: the new term is displayed from midnight in Taiwan.
  const previous = lunar.getPrevJieQi(true), next = lunar.getNextJieQi(true);
  const start = dateNumber(previous.getSolar().toYmd()), end = dateNumber(next.getSolar().toYmd()), today = dateNumber(key);
  return { current: traditional(previous.getName()), next: traditional(next.getName()), days: end - today, progress: Math.max(0, Math.min(100, (today - start) / (end - start) * 100)), today: traditional(lunar.getJieQi()) };
}
