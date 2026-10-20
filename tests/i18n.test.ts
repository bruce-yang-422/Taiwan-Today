import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import english from '../src/i18n/en.json';
import japanese from '../src/i18n/ja.json';
import { getLocale, monthName, resolveLocale, setLocale, t, weekdayName } from '../src/i18n';
import { holidayLabel, localizedCalendar } from '../src/i18n/calendar';
import { errorMessage } from '../src/i18n/errors';
import { dailyCalendar } from '../src/calendar/dailyCalendar';
import { getPublicData } from '../src/data/publicData';
import { websiteCategories } from '../src/shortcuts/websiteCatalog';
import { Solar } from 'lunar-typescript';

afterEach(() => setLocale('zh-TW'));

describe('language selection and message safety', () => {
  it('uses explicit preferences, browser languages in order, and a Traditional Chinese fallback', () => {
    expect(resolveLocale('ja', ['en-US'])).toBe('ja');
    expect(resolveLocale('auto', ['fr-FR', 'en-GB', 'ja'])).toBe('en');
    expect(resolveLocale(undefined, ['ja-JP'])).toBe('ja');
    expect(resolveLocale('invalid', ['zh-HK', 'en-US'])).toBe('zh-TW');
    expect(resolveLocale('auto', ['fr-FR'])).toBe('zh-TW');
  });

  it('substitutes values once and leaves user content and unknown source text intact', () => {
    setLocale('en');
    expect(t('編輯 {0}', ['{1}<script>'])).toBe('Edit {1}<script>');
    expect(t('尚未翻譯的新資料')).toBe('尚未翻譯的新資料');
    expect(t('顯示 {0} / {1} 則紀事', [3, 7])).toBe('Showing 3 of 7 events');
    expect(monthName(2026, 10)).toBe('October');
    expect(weekdayName(0)).toBe('Sunday');
    setLocale('ja');
    expect(monthName(2026, 10)).toBe('10月');
    expect(weekdayName(0)).toBe('日曜日');
  });

  it('keeps both catalogs complete with matching interpolation parameters', () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(japanese).sort());
    for (const [source, en] of Object.entries(english)) {
      const parameters = (message: string) => [...message.matchAll(/\{\d+\}/g)].map(match => match[0]).sort();
      expect(parameters(en), source).toEqual(parameters(source));
      expect(parameters(japanese[source as keyof typeof japanese]), source).toEqual(parameters(source));
    }
    const html = readFileSync('newtab.html', 'utf8');
    const authored = [...html.matchAll(/>([^<>]+)</g)].map(match => match[1].trim())
      .concat([...html.matchAll(/(?:aria-label|title|placeholder|alt)="([^"]+)"/g)].map(match => match[1]));
    for (const source of authored.filter(text => /[\u3400-\u9fff]/u.test(text) && !['繁體中文', '日本語'].includes(text))) {
      expect(english, source).toHaveProperty(source);
    }
    for (const category of websiteCategories) expect(english, category.name).toHaveProperty(category.name);
  });
});

describe('localized calendar and validation', () => {
  it('translates holidays and solar terms without changing dates, source data or history', () => {
    const original = dailyCalendar(new Date('2026-10-25T12:00:00+08:00'));
    setLocale('en');
    const translated = localizedCalendar(original);
    expect(translated.key).toBe(original.key);
    expect(translated.history).toBe(original.history);
    expect(translated.terms.current).toBe('First Frost');
    expect(translated.terms.next).toBe('Beginning of Winter');
    expect(translated.lunar).toMatch(/^2026 · \d+\/\d+$/);
    expect(translated.holiday).toContain('(day off)');
    expect(translated.longHoliday).toContain('Day 2 of 3');
    expect(original.terms.current).toBe('霜降');
    setLocale('ja');
    expect(localizedCalendar(original).lunar).toMatch(/年・\d+月\d+日/);
    expect(holidayLabel('國慶日補假')).toBe('国慶日（振替休日）');
    setLocale('zh-TW');
    expect(localizedCalendar(original)).toBe(original);
  });

  it('covers every bundled festival, observance, holiday and holiday period', () => {
    const data = getPublicData();
    const labels = data.festivals.flatMap(festival => [festival.name, ...(festival.observances ?? [])]);
    for (const source of [...labels, ...data.periods.map(period => period.name)]) expect(english, source).toHaveProperty(source);
    setLocale('en');
    for (const label of Object.values(data.holidays)) expect(holidayLabel(label), label).not.toMatch(/[\u3400-\u9fff]/u);
  });

  it('translates nested JSON, CSV, spreadsheet and update errors at display time', () => {
    setLocale('en');
    expect(errorMessage('第 2 筆：日期不存在，請確認閏年與月份。')).toBe('Event 2: Date does not exist. Check the month and leap year.');
    expect(errorMessage('第 3 列：標題與摘要不能空白。\n缺少必要欄位：date')).toBe('Row 3: Title and summary cannot be empty.\nMissing required column: date');
    expect(errorMessage('無法取得 holidays.json（HTTP 503）')).toBe('Could not fetch holidays.json (HTTP 503)');
    expect(errorMessage('Unknown library error')).toBe('Unknown library error');
    setLocale('ja');
    expect(errorMessage('第 2 筆：相同日期、年份與標題重複。')).toBe('2件目：日付・年・タイトルが重複しています。');
    expect(getLocale()).toBe('ja');
  });
});

describe('translated calendar data packs', () => {
  const filenames = ['long-holidays.json', 'holidays.json', 'calendar-2026.json', 'calendar-2027.json', 'festivals.json'];
  const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

  it('preserves every key, record, date, numeric value and day-off flag in both languages', () => {
    const translatedFields = new Set(['name', 'description', 'scope', 'lunar', 'solarTerm', 'holiday', 'longHoliday']);
    function compare(source: unknown, localized: unknown, path: string[] = []) {
      if (Array.isArray(source)) {
        expect(Array.isArray(localized), path.join('.')).toBe(true);
        expect((localized as unknown[]).length).toBe(source.length);
        source.forEach((value, index) => compare(value, (localized as unknown[])[index], [...path, String(index)]));
      } else if (source && typeof source === 'object') {
        expect(localized).toBeTruthy();
        expect(Object.keys(localized as object), path.join('.')).toEqual(Object.keys(source));
        for (const [key, value] of Object.entries(source)) compare(value, (localized as Record<string, unknown>)[key], [...path, key]);
      } else if (typeof source === 'string' && (translatedFields.has(path.at(-1)!) || ['dates', 'observances'].includes(path.at(-2)!))) {
        expect(typeof localized, path.join('.')).toBe('string');
        expect(Boolean(localized), path.join('.')).toBe(Boolean(source));
      } else expect(localized, path.join('.')).toEqual(source);
    }
    for (const locale of ['en', 'ja']) for (const filename of filenames) {
      compare(read(`data/${filename}`), read(`data/${locale}/${filename}`));
    }
  });

  it('fully translates English text and preserves all 730 lunar dates in both languages', () => {
    for (const filename of filenames) expect(readFileSync(`data/en/${filename}`, 'utf8'), filename).not.toMatch(/[\u3400-\u9fff]/u);
    for (const year of [2026, 2027]) {
      const en = read(`data/en/calendar-${year}.json`).data.days;
      const ja = read(`data/ja/calendar-${year}.json`).data.days;
      expect(Object.keys(en)).toHaveLength(365);
      for (const [date, day] of Object.entries(en)) {
        const [y, m, d] = date.split('-').map(Number);
        const lunar = Solar.fromYmd(y, m, d).getLunar();
        const enLabel = (day as { lunar: string }).lunar;
        expect(enLabel).toMatch(new RegExp(`^Month ${Math.abs(lunar.getMonth())}(?: \\([^)]+\\))?, day ${lunar.getDay()}$`));
        expect(ja[date].lunar).toMatch(new RegExp(`^${Math.abs(lunar.getMonth())}月(?:（[^）]+）)?${lunar.getDay()}日$`));
      }
    }
  });

  it('records public-sector sources and distinguishes derived labels from official wording', () => {
    const provenance = read('data/translation-sources.json');
    expect(provenance.policy.defaultStatus).toBe('project_translation');
    expect(provenance.terms['臺灣光復暨金門古寧頭大捷紀念日'].en.status).toBe('official');
    expect(provenance.terms['臺灣光復暨金門古寧頭大捷紀念日'].ja.status).toBe('official');
    expect(provenance.terms['文昌帝君聖誕'].en.status).toBe('derived');
    for (const record of Object.values(provenance.terms)) for (const [locale, value] of Object.entries(record as object)) {
      const item = value as { text: string; sourceIds: string[] };
      for (const id of item.sourceIds) expect(provenance.sources[id].url).toMatch(/^https:\/\//);
      const source = Object.keys(provenance.terms).find(key => provenance.terms[key] === record)!;
      expect(item.text).toBe((locale === 'en' ? english : japanese)[source as keyof typeof english]);
    }
  });
});
