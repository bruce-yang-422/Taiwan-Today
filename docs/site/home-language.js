import { homeTranslations } from './home-translations.js';
import { simplify, simplifyTree } from './simplified.js';

const nav = document.querySelector('.privacy-languages');
const links = [...nav.querySelectorAll('a')];
const requested = new URL(location.href).searchParams.get('lang');
const locale = links.some(link => link.lang === requested) ? requested : 'zh-Hant';
const description = document.querySelector('meta[name="description"]');
document.documentElement.lang = locale;

if (locale === 'zh-Hans') {
  for (const element of document.querySelectorAll('header, main > :not(.privacy-languages), footer')) {
    simplifyTree(element);
  }
  document.title = simplify(document.title);
  description.content = simplify(description.content);
}

const translations = homeTranslations[locale];
if (translations) {
  for (const [selector, strings] of Object.entries(translations)) {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (strings[index] !== undefined) element.textContent = strings[index];
    });
  }
  const english = locale === 'en';
  const brand = document.querySelector('.brand span');
  brand.firstChild.data = english ? 'Taiwan Today' : '台湾今日暦';
  if (english) brand.querySelector('small').hidden = true;
  document.title = english ? 'Taiwan Today | Chrome New Tab Calendar' : '台湾今日暦 | Chrome 新しいタブのカレンダー';
  description.content = translations['.hero .intro'][0];
  document.querySelector('header nav').setAttribute('aria-label', english ? 'Main navigation' : 'メインナビゲーション');
  document.querySelector('#features').setAttribute('aria-label', english ? 'Extension features' : '拡張機能の特徴');
  document.querySelector('.screenshot-controls').setAttribute('aria-label', english ? 'Screenshot theme' : '画面テーマ');
  document.querySelector('#conversion-preview').setAttribute('aria-label', english ? 'Preview of the first five events' : '最初の5件のプレビュー');
  const names = translations['.style-grid h3'];
  const layouts = ['classic', 'modern', 'traditional', 'workspace', 'reading'];
  for (const image of document.querySelectorAll('[data-screenshot]')) {
    image.dataset.styleName = names[layouts.indexOf(image.dataset.screenshot)];
    image.alt = english ? image.dataset.styleName + ' screenshot' : image.dataset.styleName + 'の画面';
    image.parentElement.setAttribute('aria-label', english ? 'Open ' + image.alt : image.alt + 'を原寸で開く');
  }
}

const languageLabels = { 'zh-Hant': '語言', 'zh-Hans': '语言', en: 'Language', ja: '言語' };
nav.setAttribute('aria-label', languageLabels[locale]);
for (const link of links) {
  if (link.lang === locale) link.setAttribute('aria-current', 'true');
  else link.removeAttribute('aria-current');
}
for (const link of document.querySelectorAll('a[href="./privacy.html"]')) {
  if (locale !== 'zh-Hant') link.href = './privacy.html?lang=' + locale;
}
nav.hidden = false;
