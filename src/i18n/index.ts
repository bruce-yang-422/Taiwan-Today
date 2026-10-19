import english from './en.json';
import japanese from './ja.json';

export type Locale = 'zh-TW' | 'en' | 'ja';
export type Language = Locale | 'auto';
const catalogs: Record<'en' | 'ja', Record<string, string>> = { en: english, ja: japanese };
let locale: Locale = 'zh-TW';

export function resolveLocale(language: unknown, browserLanguages: readonly string[] = []): Locale {
  if (language === 'zh-TW' || language === 'en' || language === 'ja') return language;
  for (const candidate of browserLanguages) {
    const primary = candidate.toLowerCase().split('-')[0];
    if (primary === 'ja') return 'ja';
    if (primary === 'en') return 'en';
    if (primary === 'zh') return 'zh-TW';
  }
  return 'zh-TW';
}

export function setLocale(value: Locale) { locale = value; }
export function getLocale() { return locale; }

/** Substitute values in one pass so user content containing {0} stays untouched. */
export function t(source: string, values: readonly unknown[] = []): string {
  const message = locale === 'zh-TW' ? source : catalogs[locale][source] ?? source;
  return message.replace(/\{(\d+)\}/g, (token, index: string) => Number(index) < values.length ? String(values[Number(index)]) : token);
}

export function monthName(year: number, month: number) {
  if (locale === 'zh-TW') return `${['一','二','三','四','五','六','七','八','九','十','十一','十二'][month - 1]}月`;
  return new Intl.DateTimeFormat(locale, { month: locale === 'en' ? 'long' : 'numeric', timeZone: 'Asia/Taipei' }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function weekdayName(index: number, short = false) {
  return new Intl.DateTimeFormat(locale, { weekday: short ? 'short' : 'long', timeZone: 'Asia/Taipei' }).format(new Date(Date.UTC(2026, 0, 4 + index)));
}

/** Localize the authored HTML once before any application or user content is rendered. */
export function localizeDocument() {
  document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant-TW' : locale;
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('script, style')) continue;
    const original = node.nodeValue ?? '', trimmed = original.trim();
    if (trimmed) node.nodeValue = original.replace(trimmed, t(trimmed));
  }
  document.querySelectorAll('*').forEach(element => {
    for (const attribute of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, t(value));
    }
  });
}
