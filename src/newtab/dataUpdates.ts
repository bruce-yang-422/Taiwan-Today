import { applyPublicData } from '../data/publicData';
import { CACHE_KEY, fetchPublicUpdate, parseCache, type DataCache } from '../data/updates';
import { extensionStorage, readStorage, writeStorage } from '../shortcuts/storage';

export async function initializeDataUpdates(refresh: () => void) {
  const button = document.getElementById('data-update-now') as HTMLButtonElement;
  const auto = document.getElementById('data-update-auto') as HTMLInputElement;
  const status = document.getElementById('data-update-status')!;
  const version = document.getElementById('data-update-version')!;
  let cache: DataCache | undefined, busy = false, ready = false, revision = 0;
  function controls() { button.disabled = auto.disabled = busy || !ready; }
  function showVersion() {
    version.textContent = cache ? `資料版本 ${cache.revision.slice(0, 8)} · 更新於 ${new Date(cache.updatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}` : '目前使用隨插件附帶的資料';
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
    } catch { ready = true; controls(); status.textContent = '無法讀取更新快取，繼續使用目前資料。可按「立即更新」重試。'; }
  }
  async function update(manual: boolean) {
    if (busy || !ready || (!manual && (!auto.checked || document.hidden))) return;
    busy = true; controls();
    try {
      await navigator.locks.request('taiwan-today-public-data', { ifAvailable: true }, async lock => {
        if (!lock) { if (manual) status.textContent = '另一個分頁正在更新，完成後會同步。'; return; }
        const last = await readStorage('dataUpdateLastAttempt');
        if (!manual && typeof last === 'number' && Date.now() - last < 86400000) return;
        await writeStorage('dataUpdateLastAttempt', Date.now());
        status.textContent = '正在檢查 GitHub 資料…';
        const result = await fetchPublicUpdate(cache?.revision);
        if (!result) { status.textContent = '已是最新資料。'; return; }
        // One storage write commits the complete validated snapshot; never partial files.
        await writeStorage(CACHE_KEY, result.cache);
        cache = result.cache; applyPublicData(result.data); refresh(); showVersion();
        status.textContent = '資料更新完成，已立即套用。';
      });
    } catch (error) {
      status.textContent = `更新未完成，保留原資料。${error instanceof Error ? error.message : '請稍後重試。'}`;
    } finally { busy = false; controls(); }
  }
  button.addEventListener('click', () => void update(true));
  auto.addEventListener('change', async () => {
    busy = true; controls();
    try { await writeStorage('autoDataUpdate', auto.checked); status.textContent = auto.checked ? '已開啟每日檢查，現在檢查更新。' : '已關閉自動檢查，仍保留已下載資料。'; }
    catch { auto.checked = !auto.checked; status.textContent = '無法儲存自動更新設定。'; }
    finally { busy = false; controls(); }
    if (auto.checked) void update(true);
  });
  if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[CACHE_KEY] || changes.autoDataUpdate)) void load();
  });
  else window.addEventListener('storage', event => { if ([CACHE_KEY, 'autoDataUpdate'].includes(event.key ?? '')) void load(); });
  await load();
  void update(false);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void update(false); });
  setInterval(() => void update(false), 3600000);
}
