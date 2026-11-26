import { policies } from './privacy-translations.js';
import { simplify, simplifyTree } from './simplified.js';

const nav = document.querySelector('.privacy-languages');
const article = document.querySelector('.privacy-page article');
const home = document.querySelector('header > a:last-child');
const footer = document.querySelector('footer a');
const brand = document.querySelector('.brand span');
const footerBrand = document.querySelector('footer span');
const description = document.querySelector('meta[name="description"]');
const original = {
  nodes: [...article.childNodes],
  title: document.title,
  description: description.content,
  home: home.textContent,
  footer: footer.textContent,
  brand: brand.firstChild.data,
  footerBrand: footerBrand.textContent,
};
const references = [...article.querySelectorAll('a')].map(link => link.cloneNode(true));
const links = [...nav.querySelectorAll('a')];

function render() {
  const requested = new URL(location.href).searchParams.get('lang');
  const locale = links.some(link => link.lang === requested) ? requested : 'zh-Hant';
  document.documentElement.lang = locale;
  brand.firstChild.data = { en: 'Taiwan Today', ja: '台湾今日暦', 'zh-Hans': '台湾今日历' }[locale] ?? original.brand;
  brand.querySelector('small').hidden = locale === 'en';
  footerBrand.textContent = {
    en: 'Taiwan Today · Privacy Policy',
    ja: '台湾今日暦 · プライバシーポリシー',
    'zh-Hans': '台湾今日历 · 隐私权政策',
  }[locale] ?? original.footerBrand;
  const homeUrl = locale === 'zh-Hant' ? './' : './?lang=' + locale;
  for (const link of document.querySelectorAll('header a, footer a')) link.href = homeUrl;
  for (const link of links) {
    if (link.lang === locale) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  if (locale === 'zh-Hant') {
    article.replaceChildren(...original.nodes);
    document.title = original.title;
    description.content = original.description;
    home.textContent = original.home;
    footer.textContent = original.footer;
    nav.setAttribute('aria-label', '語言');
    return;
  }
  if (locale === 'zh-Hans') {
    article.replaceChildren(...original.nodes.map(node => node.cloneNode(true)));
    simplifyTree(article);
    document.title = simplify(original.title);
    description.content = simplify(original.description);
    home.textContent = simplify(original.home);
    footer.textContent = simplify(original.footer);
    nav.setAttribute('aria-label', '语言');
    return;
  }
  const { title, meta, back, language, sources, labels, lead, sections } = policies[locale];
  document.title = title + ' | Taiwan Today';
  description.content = lead;
  home.textContent = footer.textContent = back;
  nav.setAttribute('aria-label', language);
  article.replaceChildren();
  function append(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    article.append(element);
  }
  append('h1', title);
  append('p', meta, 'quiet');
  append('p', lead, 'privacy-lead');
  sections.forEach(([heading, ...paragraphs], index) => {
    append('h2', (index + 1) + '. ' + heading);
    for (const paragraph of paragraphs) append('p', paragraph);
  });
  append('h2', sources);
  const list = document.createElement('ul');
  references.forEach((reference, index) => {
    const item = document.createElement('li');
    const link = reference.cloneNode(true);
    link.textContent = labels[index];
    item.append(link);
    list.append(item);
  });
  article.append(list);
}

nav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (link.href !== location.href) history.pushState(null, '', link.href);
  render();
});
window.addEventListener('popstate', render);
render();
nav.hidden = false;
