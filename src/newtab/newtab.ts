import { errorMessage } from '../i18n/errors';
import { t, monthName, weekdayName } from '../i18n';
import { localizedCalendar } from '../i18n/calendar';
import './newtab.css';
import './traditional.css';
import './modern.css';
import './concepts.css';
import './identity.css';
import './readability.css';
import './compact.css';
import './traditionalLayout.css';
import './googleApps.css';
import './settingsTabs.css';
import './websiteCatalog.css';
import { initializeWebsiteCatalog } from './websiteCatalog';
import { websiteGridIcon } from './websiteIcon';
import { updateCatalogSites, websiteKey } from '../shortcuts/websiteCatalog';
import { initializeSettingsTabs } from './settingsTabs';
import { initializeAbout } from './about';
import { initializeDataUpdates } from './dataUpdates';
import { initializeGoogleApps } from './googleApps';
import { createConceptLayouts } from './concepts';

import { initializeClock } from './clock';
import { isPaperRedDay, renderPaperMonth } from './paperMonth';
import { initializeTodos } from './todos';
import { initializePersonalHistory } from './personalHistory';
import { createHistorySourceControls } from './historySources';
import { normalizeHistorySources, type HistorySourceSetting } from '../calendar/history';
import { dailyCalendar, setHistorySources } from '../calendar/dailyCalendar';
import { normalizeUrl, searchUrl } from '../search/search';
import { initializeSearch } from '../search/imageSearch';
import { defaults, parseShortcuts, loadShortcuts, shortcutIcon, validIcon, type Shortcut } from '../shortcuts/shortcuts';
import { importShortcutIcon } from '../shortcuts/importIcon';
import { automaticShortcutIcon, cachedAutomaticShortcutIcon } from '../shortcuts/automaticIcon';
import { applyIconContrast } from '../shortcuts/iconContrast';
import { extensionStorage, readStorage, writeStorage } from '../shortcuts/storage';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
initializeAbout();
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
  const element = document.createElement(tag); element.className = className; element.textContent = text; return element;
};
function notify(message: string) { el('status').textContent = message; el('status').hidden = false; }
let lastDate = '';
let historyExpanded = false, historyDate = '';
let selectedDate: Date | undefined;
function renderCalendar() {
  const date = localizedCalendar(dailyCalendar(selectedDate));
  el('history-heading').textContent = selectedDate ? t("{0} 月 {1} 日的歷史", [date.month, date.day]) : t("歷史上的今天");
  document.querySelector('.calendar')!.setAttribute('aria-label', selectedDate ? t("所選日期") : t("今日日期"));
  if (lastDate === date.key) return;
  lastDate = date.key;
  if (historyDate !== date.key) { historyExpanded = false; historyDate = date.key; }
  el('year').textContent = t("{0} · 民國 {1} 年", [date.year, date.year - 1911]);
  el('month').textContent = monthName(date.year, date.month);
  el('day').textContent = String(date.day);
  document.querySelector('.calendar')!.classList.toggle('paper-red-day', isPaperRedDay(date.year, date.month, date.day));
  renderPaperMonth(el<HTMLTableElement>('paper-mini-calendar'), date);
  el('weekday').textContent = weekdayName(new Date(`${date.key}T12:00:00+08:00`).getUTCDay());
  el('lunar').textContent = t("農曆 {0}", [date.lunar]);
  el('term-current').textContent = date.terms.current;
  el('term-next').textContent = date.terms.next;
  el<HTMLProgressElement>('term-progress').value = date.terms.progress;
  el('term-countdown').textContent = t("{0}距{1} {2} 天", [date.terms.today ? t("今日{0}・", [date.terms.today]) : '', date.terms.next, date.terms.days]);
  el('festivals').replaceChildren(...date.festivals.map(name => node('span', 'badge', name)));
  if (date.holiday) {
    el('festivals').append(node('span', 'badge', date.holiday));
  }
  if (date.longHoliday) el('festivals').append(node('span', 'badge', date.longHoliday));
  el('history').replaceChildren();
  const visibleHistory = historyExpanded ? date.history : date.history.slice(0, 3);
  el('history').dataset.count = String(visibleHistory.length);
  el('history-expansion').hidden = date.history.length <= 3;
  el('history-count').textContent = t("顯示 {0} / {1} 則紀事", [visibleHistory.length, date.history.length]);
  el('history-show-more').textContent = historyExpanded ? t("收合紀事") : t("顯示更多（另 {0} 則）", [date.history.length - visibleHistory.length]);
  el('history-show-more').setAttribute('aria-expanded', String(historyExpanded));
  for (const event of visibleHistory) {
    const article = node('article', 'history-card');
    article.append(node('p', 'history-year', t("{0} · {1} · {2} 年前", [event.year, event.region, date.year - event.year])), node('h3', '', event.title), node('p', 'history-summary', event.summary));
    if (event.keyword?.trim()) {
      const more = node('a', 'history-more', t("深入了解 ↗")); more.href = searchUrl(event.keyword); article.append(more);
    }
    if (event.source?.trim()) {
      const source = node('p', 'history-source', t("資料來源："));
      try {
        const url = new URL(event.sourceUrl ?? '');
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid source');
        const link = node('a', '', event.source); link.href = url.href; source.append(link);
      } catch { source.append(document.createTextNode(event.source)); }
      article.append(source);
    }
    el('history').append(article);
  }
  if (!date.history.length) {
    const empty = node('article', 'history-card');
    empty.append(node('h3', '', t("目前沒有可顯示的紀事")), node('p', 'history-summary', t("已開啟的來源在這一天沒有紀事。可在設定的「紀事來源與順序」開啟其他來源。")));
    el('history').append(empty);
  }
}

el('history-show-more').addEventListener('click', () => {
  historyExpanded = !historyExpanded; lastDate = ''; renderCalendar();
});

type Preferences = { historySources: HistorySourceSetting[]; showHistory: boolean; showQuote: boolean; showTodos: boolean; showSecondHand: boolean; textSize: 'standard' | 'large'; appearance: 'system' | 'light' | 'dark'; style: 'classic' | 'modern' | 'traditional' | 'workspace' | 'reading'; weekStart: 0 | 1; quoteCategory: 'daily' | 'sheng-yen' | 'negative' | 'classics' | 'famous' | 'literature' | 'bible' | 'screen' };
let preferences: Preferences = { historySources: normalizeHistorySources(undefined), showHistory: true, showQuote: true, showTodos: true, showSecondHand: true, textSize: 'standard', appearance: 'system', style: 'modern', weekStart: 0, quoteCategory: 'daily' };
const displayOptions = [['show-history', 'showHistory'], ['show-quote', 'showQuote'], ['show-todos', 'showTodos'], ['show-second-hand', 'showSecondHand']] as const;
const media = matchMedia('(prefers-color-scheme: dark)');
function parsePreferences(value: unknown): Preferences {
  const p = value as Partial<Preferences> | null;
  return { historySources: normalizeHistorySources(p?.historySources), showHistory: p?.showHistory !== false, showQuote: p?.showQuote !== false, showTodos: p?.showTodos !== false, showSecondHand: p?.showSecondHand !== false, textSize: p?.textSize === 'large' ? 'large' : 'standard', appearance: p && ['system', 'light', 'dark'].includes(p.appearance ?? '') ? p.appearance! : 'system', style: p && ['classic', 'modern', 'traditional', 'workspace', 'reading'].includes(p.style ?? '') ? p.style! : 'modern', weekStart: p?.weekStart === 1 ? 1 : 0, quoteCategory: p && ['daily', 'sheng-yen', 'negative', 'classics', 'famous', 'literature', 'bible', 'screen'].includes(p.quoteCategory ?? '') ? p.quoteCategory! : 'daily' };
}
const renderHistorySources = createHistorySourceControls(sources => savePreferences(sources));
function applyPreferences() {
  if (setHistorySources(preferences.historySources)) { lastDate = ''; historyExpanded = false; renderCalendar(); }
  renderHistorySources(preferences.historySources);
  document.documentElement.classList.toggle('dark', preferences.appearance === 'dark' || (preferences.appearance === 'system' && media.matches));
  document.documentElement.dataset.style = preferences.style;
  document.documentElement.dataset.textSize = preferences.textSize;
  el<HTMLSelectElement>('text-size').value = preferences.textSize;
  concepts.setWeekStart(preferences.weekStart);
  concepts.setQuoteCategory(preferences.quoteCategory);
  el<HTMLSelectElement>('quote-category').value = preferences.quoteCategory;
  concepts.setStyle(preferences.style);
  document.querySelector<HTMLElement>('.history-section')!.hidden = !preferences.showHistory;
  el('daily-quote').hidden = !preferences.showQuote;
  document.querySelector<HTMLElement>('.todo-note')!.hidden = !preferences.showTodos;
  document.documentElement.dataset.showSecondHand = String(preferences.showSecondHand);
  for (const [id, key] of displayOptions) el<HTMLInputElement>(id).checked = preferences[key];
  document.querySelectorAll<HTMLInputElement>('input[name="appearance"]').forEach(input => input.checked = input.value === preferences.appearance);
  el('appearance').style.setProperty('--selected', String(['system', 'light', 'dark'].indexOf(preferences.appearance)));
  el<HTMLSelectElement>('calendar-style').value = preferences.style;
  el<HTMLSelectElement>('week-start').value = String(preferences.weekStart);
}
media.addEventListener('change', applyPreferences);
let preferencesReady = false;
async function savePreferences(historySources = preferences.historySources) {
  if (!preferencesReady) return;
  const next = { historySources, showHistory: el<HTMLInputElement>('show-history').checked, showQuote: el<HTMLInputElement>('show-quote').checked, showTodos: el<HTMLInputElement>('show-todos').checked, showSecondHand: el<HTMLInputElement>('show-second-hand').checked, textSize: el<HTMLSelectElement>('text-size').value, appearance: document.querySelector<HTMLInputElement>('input[name="appearance"]:checked')!.value, style: el<HTMLSelectElement>('calendar-style').value, weekStart: Number(el<HTMLSelectElement>('week-start').value), quoteCategory: el<HTMLSelectElement>('quote-category').value } as Preferences;
  const selectors = [el<HTMLFieldSetElement>('history-sources'), el<HTMLFieldSetElement>('display-options'), el<HTMLSelectElement>('text-size'), el<HTMLFieldSetElement>('appearance'), el<HTMLSelectElement>('calendar-style'), el<HTMLSelectElement>('week-start'), el<HTMLSelectElement>('quote-category')];
  selectors.forEach(s => s.disabled = true);
  try { await writeStorage('preferences', next); preferences = next; }
  catch { notify(t("設定無法儲存，請稍後重試。")); }
  finally { applyPreferences(); selectors.forEach(s => s.disabled = false); }
}
el('display-options').addEventListener('change', () => void savePreferences());
el('text-size').addEventListener('change', () => void savePreferences());
el('appearance').addEventListener('change', () => void savePreferences());
el('calendar-style').addEventListener('change', () => void savePreferences());
el('week-start').addEventListener('change', () => void savePreferences());
el('quote-category').addEventListener('change', () => void savePreferences());
initializeSettingsTabs();
el('settings-open').addEventListener('click', () => el<HTMLDialogElement>('settings-dialog').showModal());
document.querySelectorAll<HTMLElement>('[data-close]').forEach(button => button.addEventListener('click', () => el<HTMLDialogElement>(button.dataset.close!).close()));
initializeSearch(notify);

let shortcuts: Shortcut[] = structuredClone(defaults), editing: string | null = null, dragging: string | null = null, saving = false, shortcutsReady = false;
const dialog = el<HTMLDialogElement>('shortcut-dialog');
const websiteCatalog = initializeWebsiteCatalog(() => shortcuts, async (sites, removedSites) => {
  if (!shortcutsReady || saving) return false;
  const removeKeys = new Set(removedSites.map(site => websiteKey(site.url)));
  const removed = shortcuts.filter(item => removeKeys.has(websiteKey(item.url))).length;
  const next = updateCatalogSites(shortcuts, sites, removedSites);
  const added = next.length - shortcuts.length + removed;
  if (!added && !removed) return true;
  if (!await saveShortcuts(next)) return false;
  notify(removed ? t("捷徑已更新：新增 {0} 個、移除 {1} 個。", [added, removed]) : t("已新增 {0} 個網站捷徑。", [added]));
  return true;
});
function openShortcut(item?: Shortcut) {
  if (!shortcutsReady || saving) return;
  editing = item?.id ?? null;
  el('shortcut-title').textContent = item ? t("編輯捷徑") : t("新增捷徑");
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
  } catch { notify(t("捷徑無法儲存，請檢查儲存空間後重試。")); return false; }
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
      applyIconContrast(image, icon);
      image.addEventListener('error', () => { icon.textContent = item.name.slice(0, 1).toUpperCase(); });
      icon.replaceChildren(image);
    }
    if (shortcutsReady && !validIcon(item.icon)) {
      const showIcon = (iconUrl: string | undefined) => {
        if (!iconUrl || !icon.isConnected) return;
        const image = node('img'); image.src = iconUrl; image.alt = ''; image.width = 24; image.height = 24;
        applyIconContrast(image, icon);
        image.addEventListener('error', () => { icon.textContent = item.name.slice(0, 1).toUpperCase(); });
        icon.replaceChildren(image);
      };
      void cachedAutomaticShortcutIcon(item.url).then(iconUrl => {
        showIcon(iconUrl);
        return automaticShortcutIcon(item.url);
      }).then(showIcon);
    }
    link.append(icon, node('span', 'shortcut-name', item.name));
    const edit = node('button', 'shortcut-edit', '⋯'); edit.type = 'button'; edit.dataset.editId = item.id; edit.setAttribute('aria-label', t("編輯 {0}", [item.name])); edit.title = t("編輯捷徑；Alt + 左右方向鍵排序");
    edit.addEventListener('click', () => openShortcut(item));
    edit.addEventListener('keydown', e => { if (e.altKey && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const target = shortcuts[shortcuts.findIndex(s => s.id === item.id) + (e.key === 'ArrowLeft' ? -1 : 1)]; if (target) void reorder(item.id, target.id); } });
    wrapper.addEventListener('dragstart', e => { dragging = item.id; e.dataTransfer?.setData('text/plain', item.id); wrapper.classList.add('dragging'); });
    wrapper.addEventListener('dragend', () => { dragging = null; wrapper.classList.remove('dragging'); });
    wrapper.addEventListener('dragover', e => { if (dragging) e.preventDefault(); });
    wrapper.addEventListener('drop', e => { e.preventDefault(); if (dragging) void reorder(dragging, item.id); dragging = null; });
    wrapper.append(link, edit); container.append(wrapper);
  }
  const add = node('button', 'shortcut-add'); add.type = 'button'; add.setAttribute('aria-label', t("新增捷徑")); add.disabled = !shortcutsReady;
  add.append(node('span', 'shortcut-icon', '+'), node('span', '', t("新增捷徑"))); add.addEventListener('click', () => openShortcut()); container.append(add);
  const browse = node('button', 'shortcut-add shortcut-catalog'); browse.type = 'button'; browse.disabled = !shortcutsReady;
  browse.setAttribute('aria-label', t("常用網站"));
  const browseIcon = node('span', 'shortcut-icon'); browseIcon.append(websiteGridIcon());
  browse.append(browseIcon, node('span', '', t("常用網站")));
  browse.addEventListener('click', () => { if (shortcutsReady && !saving) websiteCatalog.open(); });
  container.append(browse);
  websiteCatalog.refresh();
}
el('shortcut-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = el<HTMLInputElement>('shortcut-name').value.trim();
  try {
    if (!name) throw new Error(t("請輸入捷徑名稱。"));
    const url = normalizeUrl(el<HTMLInputElement>('shortcut-url').value);
    let icon = el<HTMLInputElement>('shortcut-icon-clear').checked ? undefined : shortcuts.find(s => s.id === editing)?.icon;
    const file = el<HTMLInputElement>('shortcut-icon').files?.[0];
    if (file) icon = await importShortcutIcon(file);
    const item = { id: editing ?? crypto.randomUUID(), name, url, order: shortcuts.length, ...(icon ? { icon } : {}) };
    const next = editing ? shortcuts.map(s => s.id === editing ? { ...item, order: s.order } : s) : [...shortcuts, item];
    if (await saveShortcuts(next)) dialog.close();
  } catch (error) { el('shortcut-error').textContent = error instanceof Error ? errorMessage(error.message) : t("網址格式有誤。"); }
});
el('shortcut-delete').addEventListener('click', async () => { if (editing && await saveShortcuts(shortcuts.filter(s => s.id !== editing))) dialog.close(); });
async function initialize() {
  renderCalendar(); applyPreferences(); renderShortcuts();
  const [storedShortcuts, storedPreferences] = await Promise.allSettled([loadShortcuts(), readStorage('preferences')]);
  try { if (storedShortcuts.status === 'rejected') throw storedShortcuts.reason; shortcuts = parseShortcuts(storedShortcuts.value); shortcutsReady = true; }
  catch { notify(t("無法讀取已儲存的捷徑；暫時顯示預設捷徑。請重新載入後再編輯。")); }
  if (storedPreferences.status === 'fulfilled') { preferences = parsePreferences(storedPreferences.value); preferencesReady = true; }
  else { notify(t("無法讀取設定，請重新載入後再試。")); }
  el<HTMLFieldSetElement>('history-sources').disabled = !preferencesReady;
  el<HTMLFieldSetElement>('display-options').disabled = !preferencesReady;
  el<HTMLSelectElement>('text-size').disabled = !preferencesReady;
  el<HTMLFieldSetElement>('appearance').disabled = !preferencesReady;
  el<HTMLSelectElement>('calendar-style').disabled = !preferencesReady;
  el<HTMLSelectElement>('week-start').disabled = !preferencesReady;
  el<HTMLSelectElement>('quote-category').disabled = !preferencesReady;
  applyPreferences(); renderShortcuts();
}
if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.shortcuts) { try { shortcuts = parseShortcuts(changes.shortcuts.newValue); renderShortcuts(); } catch { notify(t("其他分頁的捷徑資料無法讀取。")); } }
  if (changes.preferences) { preferences = parsePreferences(changes.preferences.newValue); applyPreferences(); }
});
else window.addEventListener('storage', event => { if (['shortcuts', 'preferences'].includes(event.key ?? '')) void initialize(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderCalendar(); });
window.addEventListener('focus', renderCalendar);
setInterval(renderCalendar, 30_000);
initializeGoogleApps();
initializeClock();
const concepts = createConceptLayouts(date => { selectedDate = date; renderCalendar(); });
setInterval(() => concepts.refresh(), 30_000);
void initializeTodos();
initializePersonalHistory(() => { lastDate = ''; renderCalendar(); });
void initialize().catch(() => notify(t("頁面載入失敗，請重新整理。")));

void initializeDataUpdates(() => { lastDate = ''; renderCalendar(); concepts.refreshData(); });
