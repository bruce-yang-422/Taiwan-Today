import document from '../../data/observances.json';
import { getLocale, t } from './index';

export function observanceLabels(date: string): string[] {
  const regions = new Intl.DisplayNames(getLocale(), { type: 'region' });
  return document.data.filter(entry => {
    if (entry.recurring) return entry.date === date.slice(5);
    return entry.date <= date && date <= (entry.endDate ?? entry.date);
  }).map(entry => {
    const name = t(entry.name);
    if (entry.region === 'global') return name;
    const region = getLocale() === 'zh-TW' && entry.region === 'TW'
      ? '臺灣'
      : regions.of(entry.region) ?? entry.region;
    return `${region}｜${name}`;
  });
}
