import { errorMessage } from '../i18n/errors';
import { t, getLocale } from '../i18n';
import { applyPublicData } from '../data/publicData';
import { CACHE_KEY, fetchPublicUpdate, parseCache, type DataCache } from '../data/updates';
import { extensionStorage, readStorage, writeStorage } from '../shortcuts/storage';
import { renderAbout } from './about';

export async function initializeDataUpdates(refresh: () => void) {
  const button = document.getElementById('data-update-now') as HTMLButtonElement;
  const auto = document.getElementById('data-update-auto') as HTMLInputElement;
  const status = document.getElementById('data-update-status')!;
  const version = document.getElementById('data-update-version')!;
  let cache: DataCache | undefined, busy = false, ready = false, revision = 0;
  function controls() { button.disabled = auto.disabled = busy || !ready; }
  function showVersion() {
    const label = renderAbout(cache);
    version.textContent = cache ? t("資料版本 {0} · 下載於 {1}", [label, new Date(cache.updatedAt).toLocaleString(getLocale(), { timeZone: 'Asia/Taipei' })]) : t("隨插件附帶的資料 · {0}", [label]);
  }
  async function load() {
    const token = ++revision;
    try {
      const [stored, enabled] = await Promise.all([readStorage(CACHE_KEY), readStorage('autoDataUpdate')]);
      if (token !== revision) return;
      auto.checked = enabled === true;
      if (stored !== undefined && stored !== null) {
        const parsed = parseCache(stored); cache = parsed.cache; applyPublicData(parsed.data); refresh();
      }
      ready = true; showVersion(); controls();
    } catch { ready = true; controls(); status.textContent = t("無法讀取更新快取，繼續使用目前資料。可按「立即更新」重試。"); }
  }
  async function update(manual: boolean) {
    if (busy || !ready || (!manual && (!auto.checked || document.hidden))) return;
    busy = true; controls();
    try {
      await navigator.locks.request('taiwan-today-public-data', { ifAvailable: true }, async lock => {
        if (!lock) { if (manual) status.textContent = t("另一個分頁正在更新，完成後會同步。"); return; }
        const last = await readStorage('dataUpdateLastAttempt');
        if (!manual && typeof last === 'number' && Date.now() - last < 86400000) return;
        await writeStorage('dataUpdateLastAttempt', Date.now());
        status.textContent = t("正在檢查 GitHub 資料…");
        const result = await fetchPublicUpdate(cache?.manifest?.version ? cache.revision : undefined);
        if (!result) { status.textContent = t("已是最新資料。"); return; }
        // One storage write commits the complete validated snapshot; never partial files.
        await writeStorage(CACHE_KEY, result.cache);
        cache = result.cache; applyPublicData(result.data); refresh(); showVersion();
        status.textContent = t("資料更新完成，已立即套用。");
      });
    } catch (error) {
      status.textContent = t("更新未完成，保留原資料。{0}", [error instanceof Error ? errorMessage(error.message) : t("請稍後重試。")]);
    } finally { busy = false; controls(); }
  }
  // Call request synchronously from the user gesture, before any storage awaits.
  function requestAccess(): Promise<boolean> {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.permissions) {
      return chrome.permissions.request({ origins: ['https://raw.githubusercontent.com/*'] });
    }
    return Promise.resolve(true);
  }
  const deniedMessage = t("未允許 GitHub 連線，保留原資料。需要更新時可再次按「立即更新」並允許。");
  button.addEventListener('click', async () => {
    if (busy || !ready) return;
    busy = true; controls();
    let granted = false;
    try { granted = await requestAccess(); if (!granted) status.textContent = deniedMessage; }
    catch { status.textContent = t("無法開啟授權視窗。請到 chrome://extensions 重新載入新版擴充功能，再開啟新分頁重試。"); }
    finally { busy = false; controls(); }
    if (granted) void update(true);
  });
  auto.addEventListener('change', async () => {
    busy = true; controls();
    try {
      if (auto.checked && !await requestAccess()) { auto.checked = false; status.textContent = deniedMessage; return; }
      await writeStorage('autoDataUpdate', auto.checked); status.textContent = auto.checked ? t("已開啟每日檢查，現在檢查更新。") : t("已關閉自動檢查，仍保留已下載資料。");
    }
    catch { auto.checked = !auto.checked; status.textContent = t("無法儲存自動更新設定。"); }
    finally { busy = false; controls(); }
    if (auto.checked) void update(true);
  });
  if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[CACHE_KEY] || changes.autoDataUpdate)) void load();
  });
  else window.addEventListener('storage', event => { if ([CACHE_KEY, 'autoDataUpdate'].includes(event.key ?? '')) void load(); });
  showVersion();
  await load();
  void update(false);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void update(false); });
  setInterval(() => void update(false), 3600000);
}
