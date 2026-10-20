import { t } from '../i18n';
import { defaultContext, getCalendarContext, parseContext, setCalendarContext } from '../calendar/context';
import { extensionStorage, readStorage, writeStorage } from '../shortcuts/storage';

export function initializeCalendarContext() {
  const mode = document.getElementById('calendar-mode') as HTMLSelectElement;
  const zone = document.getElementById('calendar-timezone') as HTMLSelectElement;
  const clock = document.getElementById('travel-clock') as HTMLSelectElement;
  const status = document.getElementById('calendar-context-status')!;
  const zones = Intl.supportedValuesOf('timeZone');
  if (!zones.includes(Intl.DateTimeFormat().resolvedOptions().timeZone)) zones.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  zones.sort().forEach(value => zone.add(new Option(value.replaceAll('_', ' '), value)));
  let ready = false;
  function render() {
    const context = getCalendarContext();
    mode.value = context.mode; zone.value = context.timezone; clock.value = context.travelClock;
    document.documentElement.dataset.calendarMode = context.mode;
    document.getElementById('calendar-timezone-field')!.hidden = context.mode !== 'international';
    document.getElementById('travel-clock-field')!.hidden = context.mode !== 'travel';
    for (const element of [mode, zone, clock]) element.disabled = !ready;
  }
  async function load() {
    try { setCalendarContext(parseContext(await readStorage('calendarContext'))); }
    catch { setCalendarContext(defaultContext); status.textContent = t('無法讀取日曆模式，暫用臺灣設定。'); }
    ready = true; render();
  }
  async function save() {
    if (!ready) return;
    const next = { mode: mode.value, timezone: zone.value, travelClock: clock.value };
    ready = false;
    for (const element of [mode, zone, clock]) element.disabled = true;
    try { await writeStorage('calendarContext', next); setCalendarContext(next); status.textContent = ''; }
    catch { status.textContent = t('設定無法儲存，請稍後重試。'); }
    ready = true; render();
  }
  for (const element of [mode, zone, clock]) element.addEventListener('change', () => void save());
  if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.calendarContext) void load(); });
  else window.addEventListener('storage', event => { if (event.key === 'calendarContext' || event.key === null) void load(); });
  render(); void load();
}
