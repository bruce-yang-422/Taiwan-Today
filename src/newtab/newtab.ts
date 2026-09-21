import './newtab.css';
import './traditional.css';
import './modern.css';
import './concepts.css';
import { createConceptLayouts } from './concepts';

import { initializeClock } from './clock';
import { initializeTodos } from './todos';
import { dailyCalendar } from '../calendar/dailyCalendar';
import { normalizeUrl, searchUrl } from '../search/search';
import { defaults, parseShortcuts, loadShortcuts, validIcon, shortcutIcon, type Shortcut } from '../shortcuts/shortcuts';
import { extensionStorage, readStorage, writeStorage } from '../shortcuts/storage';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const element = document.createElement(tag); element.className = className; element.textContent = text; return element;
};
function notify(message: string) { el('status').textContent = message; el('status').hidden = false; }
let lastDate = '';
let selectedDate: Date | undefined;
function renderCalendar() {
  const date = dailyCalendar(selectedDate);
  el('history-heading').textContent = selectedDate ? `${date.month} 月 ${date.day} 日的歷史` : '歷史上的今天';
  document.querySelector('.calendar')!.setAttribute('aria-label', selectedDate ? '所選日期' : '今日日期');
  if (lastDate === date.key) return;
  lastDate = date.key;
  el('year').textContent = `${date.year} · 民國 ${date.year - 1911} 年`;
  el('month').textContent = `${['一','二','三','四','五','六','七','八','九','十','十一','十二'][date.month - 1]}月`;
  el('day').textContent = String(date.day);
  el('weekday').textContent = date.weekday;
  el('lunar').textContent = `農曆 ${date.lunar}`;
  el('term-current').textContent = date.terms.current;
  el('term-next').textContent = date.terms.next;
  el<HTMLProgressElement>('term-progress').value = date.terms.progress;
  el('term-countdown').textContent = `${date.terms.today ? `今日${date.terms.today}・` : ''}距${date.terms.next} ${date.terms.days} 天`;
  el('festivals').replaceChildren(...date.festivals.map(name => node('span', 'badge', name)));
  if (date.holiday) {
    el('festivals').append(node('span', 'badge', date.holiday));
  }
  if (date.longHoliday) el('festivals').append(node('span', 'badge', date.longHoliday));
  el('history').replaceChildren();
  el('history').dataset.count = String(date.history.length);
  for (const event of date.history) {
    const article = node('article', 'history-card');
    const more = node('a', 'history-more', '深入了解 ↗'); more.href = searchUrl(event.keyword);
    const source = node('p', 'history-source', '資料來源：'); const link = node('a', '', event.source); link.href = event.sourceUrl; source.append(link);
    article.append(node('p', 'history-year', `${event.year} · ${event.region} · ${date.year - event.year} 年前`), node('h3', '', event.title), node('p', 'history-summary', event.summary), more, source);
    el('history').append(article);
  }
  if (!date.history.length) {
    const empty = node('article', 'history-card');
    empty.append(node('h3', '', '平凡的一天，也值得記得'), node('p', 'history-summary', '這一天的歷史紀事尚未收錄。放慢一點，看看窗外，也為今天留下一點自己的記憶。'));
    el('history').append(empty);
  }
}

type Preferences = { appearance: 'system' | 'light' | 'dark'; style: 'classic' | 'modern' | 'traditional' | 'workspace' | 'reading'; weekStart: 0 | 1; quoteCategory: 'daily' | 'sheng-yen' | 'negative' | 'classics' };
let preferences: Preferences = { appearance: 'system', style: 'modern', weekStart: 0, quoteCategory: 'daily' };
const media = matchMedia('(prefers-color-scheme: dark)');
function parsePreferences(value: unknown): Preferences {
  const p = value as Partial<Preferences> | null;
  return { appearance: p && ['system', 'light', 'dark'].includes(p.appearance ?? '') ? p.appearance! : 'system', style: p && ['classic', 'modern', 'traditional', 'workspace', 'reading'].includes(p.style ?? '') ? p.style! : 'modern', weekStart: p?.weekStart === 1 ? 1 : 0, quoteCategory: p && ['daily', 'sheng-yen', 'negative', 'classics'].includes(p.quoteCategory ?? '') ? p.quoteCategory! : 'daily' };
}
function applyPreferences() {
  document.documentElement.classList.toggle('dark', preferences.appearance === 'dark' || (preferences.appearance === 'system' && media.matches));
  document.documentElement.dataset.style = preferences.style;
  concepts.setWeekStart(preferences.weekStart);
  concepts.setQuoteCategory(preferences.quoteCategory);
  el<HTMLSelectElement>('quote-category').value = preferences.quoteCategory;
  concepts.setStyle(preferences.style);
  document.querySelectorAll<HTMLInputElement>('input[name="appearance"]').forEach(input => input.checked = input.value === preferences.appearance);
  el('appearance').style.setProperty('--selected', String(['system', 'light', 'dark'].indexOf(preferences.appearance)));
  el<HTMLSelectElement>('calendar-style').value = preferences.style;
  el<HTMLSelectElement>('week-start').value = String(preferences.weekStart);
}
media.addEventListener('change', applyPreferences);
let preferencesReady = false;
async function savePreferences() {
  if (!preferencesReady) return;
  const next = { appearance: document.querySelector<HTMLInputElement>('input[name="appearance"]:checked')!.value, style: el<HTMLSelectElement>('calendar-style').value, weekStart: Number(el<HTMLSelectElement>('week-start').value), quoteCategory: el<HTMLSelectElement>('quote-category').value } as Preferences;
  const selectors = [el<HTMLFieldSetElement>('appearance'), el<HTMLSelectElement>('calendar-style'), el<HTMLSelectElement>('week-start'), el<HTMLSelectElement>('quote-category')];
  selectors.forEach(s => s.disabled = true);
  try { await writeStorage('preferences', next); preferences = next; }
  catch { notify('外觀設定無法儲存，請稍後重試。'); }
  finally { applyPreferences(); selectors.forEach(s => s.disabled = false); }
}
el('appearance').addEventListener('change', () => void savePreferences());
el('calendar-style').addEventListener('change', () => void savePreferences());
el('week-start').addEventListener('change', () => void savePreferences());
el('quote-category').addEventListener('change', () => void savePreferences());
el('settings-open').addEventListener('click', () => el<HTMLDialogElement>('settings-dialog').showModal());
document.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', () => el<HTMLDialogElement>(button.dataset.close!).close()));
el<HTMLFormElement>('search-form').addEventListener('submit', event => {
  event.preventDefault(); const query = el<HTMLInputElement>('search-input').value.trim(); if (query) location.assign(searchUrl(query));
});

let shortcuts: Shortcut[] = structuredClone(defaults), editing: string | null = null, dragging: string | null = null, saving = false, shortcutsReady = false;
const dialog = el<HTMLDialogElement>('shortcut-dialog');
function openShortcut(item?: Shortcut) {
  if (!shortcutsReady || saving) return;
  editing = item?.id ?? null;
  el('shortcut-title').textContent = item ? '編輯捷徑' : '新增捷徑';
  el<HTMLInputElement>('shortcut-name').value = item?.name ?? '';
  el<HTMLInputElement>('shortcut-url').value = item?.url ?? '';
  el<HTMLInputElement>('shortcut-icon').value = '';
  el<HTMLInputElement>('shortcut-icon-clear').checked = false;
  el('shortcut-error').textContent = '';
  el('shortcut-delete').hidden = !item;
  dialog.showModal(); el('shortcut-name').focus();
}
async function saveShortcuts(next: Shortcut[]) {
  if (saving || !shortcutsReady) return false;
  saving = true;
  dialog.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    const ordered = next.map((s, order) => ({ ...s, order }));
    await writeStorage('shortcuts', ordered); shortcuts = ordered; renderShortcuts(); return true;
  } catch { notify('捷徑無法儲存，請檢查儲存空間後重試。'); return false; }
  finally { saving = false; dialog.querySelectorAll('button').forEach(b => b.disabled = false); }
}
async function reorder(from: string, to: string) {
  const next = [...shortcuts], start = next.findIndex(s => s.id === from), end = next.findIndex(s => s.id === to);
  if (start < 0 || end < 0 || start === end) return;
  const [moved] = next.splice(start, 1); next.splice(end, 0, moved);
  if (await saveShortcuts(next)) { document.querySelector<HTMLButtonElement>(`[data-edit-id="${CSS.escape(from)}"]`)?.focus(); }
}
function renderShortcuts() {
  const container = el('shortcuts'); container.replaceChildren();
  for (const item of shortcuts) {
    const wrapper = node('div', 'shortcut'); wrapper.draggable = true;
    const link = node('a', 'shortcut-link'); link.href = item.url; link.title = item.url; link.draggable = false;
    const icon = node('span', 'shortcut-icon', item.name.slice(0, 1).toUpperCase()); icon.setAttribute('aria-hidden', 'true');
    const iconUrl = shortcutIcon(item);
    if (iconUrl) {
      const image = node('img'); image.src = iconUrl; image.alt = ''; image.width = 24; image.height = 24;
      image.addEventListener('error', () => { icon.textContent = item.name.slice(0, 1).toUpperCase(); });
      icon.replaceChildren(image);
    }
    link.append(icon, node('span', 'shortcut-name', item.name));
    const edit = node('button', 'shortcut-edit', '⋯'); edit.type = 'button'; edit.dataset.editId = item.id; edit.setAttribute('aria-label', `編輯 ${item.name}`); edit.title = '編輯捷徑；Alt + 左右方向鍵排序';
    edit.addEventListener('click', () => openShortcut(item));
    edit.addEventListener('keydown', e => { if (e.altKey && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const target = shortcuts[shortcuts.findIndex(s => s.id === item.id) + (e.key === 'ArrowLeft' ? -1 : 1)]; if (target) void reorder(item.id, target.id); } });
    wrapper.addEventListener('dragstart', e => { dragging = item.id; e.dataTransfer?.setData('text/plain', item.id); wrapper.classList.add('dragging'); });
    wrapper.addEventListener('dragend', () => { dragging = null; wrapper.classList.remove('dragging'); });
    wrapper.addEventListener('dragover', e => { if (dragging) e.preventDefault(); });
    wrapper.addEventListener('drop', e => { e.preventDefault(); if (dragging) void reorder(dragging, item.id); dragging = null; });
    wrapper.append(link, edit); container.append(wrapper);
  }
  const add = node('button', 'shortcut-add'); add.type = 'button'; add.setAttribute('aria-label', '新增捷徑'); add.disabled = !shortcutsReady;
  add.append(node('span', 'shortcut-icon', '+'), node('span', '', '新增捷徑')); add.addEventListener('click', () => openShortcut()); container.append(add);
}
el('shortcut-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = el<HTMLInputElement>('shortcut-name').value.trim();
  try {
    if (!name) throw new Error('請輸入捷徑名稱。');
    const url = normalizeUrl(el<HTMLInputElement>('shortcut-url').value);
    let icon = el<HTMLInputElement>('shortcut-icon-clear').checked ? undefined : shortcuts.find(s => s.id === editing)?.icon;
    const file = el<HTMLInputElement>('shortcut-icon').files?.[0];
    if (file) {
      if (file.size > 65536) throw new Error('圖示不得超過 64 KB。');
      icon = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('圖示讀取失敗。')); reader.readAsDataURL(file); });
      if (!validIcon(icon)) throw new Error('請選擇 PNG 或 ICO 圖示。');
    }
    const item = { id: editing ?? crypto.randomUUID(), name, url, order: shortcuts.length, ...(icon ? { icon } : {}) };
    const next = editing ? shortcuts.map(s => s.id === editing ? { ...item, order: s.order } : s) : [...shortcuts, item];
    if (await saveShortcuts(next)) dialog.close();
  } catch (error) { el('shortcut-error').textContent = error instanceof Error ? error.message : '網址格式有誤。'; }
});
el('shortcut-delete').addEventListener('click', async () => { if (editing && await saveShortcuts(shortcuts.filter(s => s.id !== editing))) dialog.close(); });
async function initialize() {
  renderCalendar(); applyPreferences(); renderShortcuts();
  const [storedShortcuts, storedPreferences] = await Promise.allSettled([loadShortcuts(), readStorage('preferences')]);
  try { if (storedShortcuts.status === 'rejected') throw storedShortcuts.reason; shortcuts = parseShortcuts(storedShortcuts.value); shortcutsReady = true; }
  catch { notify('無法讀取已儲存的捷徑；暫時顯示預設捷徑。請重新載入後再編輯。'); }
  if (storedPreferences.status === 'fulfilled') { preferences = parsePreferences(storedPreferences.value); preferencesReady = true; }
  else { notify('無法讀取外觀設定，請重新載入後再試。'); }
  el<HTMLFieldSetElement>('appearance').disabled = !preferencesReady;
  el<HTMLSelectElement>('calendar-style').disabled = !preferencesReady;
  el<HTMLSelectElement>('week-start').disabled = !preferencesReady;
  el<HTMLSelectElement>('quote-category').disabled = !preferencesReady;
  applyPreferences(); renderShortcuts();
}
if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.shortcuts) { try { shortcuts = parseShortcuts(changes.shortcuts.newValue); renderShortcuts(); } catch { notify('其他分頁的捷徑資料無法讀取。'); } }
  if (changes.preferences) { preferences = parsePreferences(changes.preferences.newValue); applyPreferences(); }
});
else window.addEventListener('storage', event => { if (['shortcuts', 'preferences'].includes(event.key ?? '')) void initialize(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderCalendar(); });
window.addEventListener('focus', renderCalendar);
setInterval(renderCalendar, 30_000);
initializeClock();
const concepts = createConceptLayouts(date => { selectedDate = date; renderCalendar(); });
setInterval(() => concepts.refresh(), 30_000);
void initializeTodos();
void initialize().catch(() => notify('頁面載入失敗，請重新整理。'));
