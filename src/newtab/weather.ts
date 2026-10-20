import { getLocale, t } from '../i18n';
import { getCalendarContext, setGpsTimezone } from '../calendar/context';
import { extensionStorage, readStorage, writeStorage } from '../shortcuts/storage';
import { cities, cityTown, conditions, coordinates, defaultLocation, fetchWeather, freshWeather, localDate, locationKey, parseLocation, parseWeather, WEATHER_INTERVAL, type WeatherLocation, type WeatherSnapshot } from '../weather/weather';

export function initializeWeather() {
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const panel = el('paper-weather'), picker = el<HTMLSelectElement>('weather-location');
  const district = el<HTMLSelectElement>('weather-district');
  const form = el<HTMLFormElement>('weather-gps-form'), latitude = el<HTMLInputElement>('weather-latitude'), longitude = el<HTMLInputElement>('weather-longitude');
  const status = el('weather-status'), refreshButton = el<HTMLButtonElement>('weather-refresh');
  for (const city of cities) picker.add(new Option(t(city.name), city.id));
  picker.add(new Option(t('自訂 GPS（國內外）'), 'gps'));
  let location: WeatherLocation = defaultLocation, snapshot: WeatherSnapshot | undefined;
  let ready = false, visible = false, running = false, saving = false, revision = 0;
  let timer: ReturnType<typeof setTimeout> | undefined, controller: AbortController | undefined;
  const needsWeather = () => visible || (getCalendarContext().mode === 'travel' && getCalendarContext().travelClock === 'gps');
  function cancel() { revision++; controller?.abort(); controller = undefined; running = false; clearTimeout(timer); }
  function schedule(delay = WEATHER_INTERVAL) {
    clearTimeout(timer);
    if (needsWeather() && !document.hidden) timer = setTimeout(() => void refresh(), Math.max(1000, delay));
  }
  function render() {
    picker.value = !form.hidden || location.kind === 'gps' ? 'gps' : location.id;
    picker.disabled = !ready || saving; refreshButton.disabled = !ready || running || saving;
    district.disabled = !ready || saving;
    el('weather-district-field').hidden = !form.hidden || location.kind !== 'city';
    if (location.kind === 'city') {
      const { city, town } = cityTown(location);
      if (district.dataset.city !== city.id) {
        district.replaceChildren(...city.towns.map(town => new Option(getLocale() === 'en' ? town.english : town.name, town.id)));
        district.dataset.city = city.id;
      }
      district.value = town.id;
      el('weather-location-name').textContent = getLocale() === 'en' ? `${town.english}, ${city.english}` : `${t(city.name)} ${town.name}`;
    } else el('weather-location-name').textContent = `GPS · ${location.latitude}, ${location.longitude}`;
    el('weather-settings-current').textContent = el('weather-location-name').textContent;
    el('weather-settings-status').textContent = status.textContent;
    el<HTMLButtonElement>('weather-gps-edit').hidden = location.kind !== 'gps';
    el<HTMLButtonElement>('weather-gps-edit').disabled = !ready || saving;
    const coordinate = el('weather-coordinate');
    coordinate.hidden = location.kind !== 'gps';
    coordinate.textContent = location.kind === 'gps' ? `${location.latitude}, ${location.longitude}` : '';
    el('weather-days').hidden = !snapshot;
    if (!snapshot) return;
    const currentDay = localDate(snapshot.timezone);
    panel.querySelectorAll('.weather-days h2')[0].textContent = snapshot.date === currentDay ? t('今日即時') : snapshot.date;
    panel.querySelectorAll('.weather-days h2')[1].textContent = snapshot.date === currentDay ? t('明日預報') : snapshot.tomorrow.date;
    const current = conditions[snapshot.current.code], tomorrow = conditions[snapshot.tomorrow.code];
    el('weather-now-icon').textContent = snapshot.current.code === 0 && !snapshot.current.isDay ? '☾' : current.symbol;
    el('weather-next-icon').textContent = tomorrow.symbol;
    el('weather-now-temperature').textContent = `${Math.round(snapshot.current.temperature)}°C`;
    el('weather-next-temperature').textContent = `${Math.round(snapshot.tomorrow.minimum)}–${Math.round(snapshot.tomorrow.maximum)}°C`;
    el('weather-now-condition').textContent = t(current.name);
    el('weather-next-condition').textContent = t(tomorrow.name);
    el('weather-rain').textContent = snapshot.tomorrow.rain === null ? '' : t('降雨 {0}%', [snapshot.tomorrow.rain]);
    el('weather-days').title = `${snapshot.date} / ${snapshot.tomorrow.date} · ${snapshot.timezone}`;
  }
  function showTimestamp() {
    if (!snapshot) return;
    const updated = new Intl.DateTimeFormat(getLocale(), { timeZone: snapshot.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(snapshot.fetchedAt);
    status.textContent = t('{0} 更新 · 每 10 分鐘', [updated]);
    status.title = t('天氣日期依地點時區：{0}', [snapshot.timezone]);
  }
  async function refresh(force = false) {
    if (!ready || !needsWeather() || document.hidden || running || saving) return;
    if (!force && snapshot && freshWeather(snapshot)) { schedule(snapshot.fetchedAt + WEATHER_INTERVAL - Date.now()); return; }
    const token = revision, selected = location, key = locationKey(selected);
    const valid = () => token === revision && needsWeather() && !document.hidden;
    running = true; controller = new AbortController();
    const signal = controller.signal;
    status.textContent = t('正在更新天氣…'); render();
    try {
      await navigator.locks.request(`taiwan-today-weather:${key}`, { signal }, async () => {
        if (!valid()) return;
        if (!force) {
          try {
            const cached = parseWeather(await readStorage('weatherCache'), key);
            if (cached && freshWeather(cached) && valid()) { snapshot = cached; setGpsTimezone(cached.timezone); showTimestamp(); return; }
          } catch { /* A failed cache read must not prevent a live request. */ }
        }
        const cache = await fetchWeather(selected, signal);
        if (!valid()) return;
        snapshot = parseWeather(cache, key)!;
        setGpsTimezone(snapshot.timezone); showTimestamp(); render();
        try { await writeStorage('weatherCache', cache); } catch { /* Current data remains usable without persistence. */ }
      });
    } catch {
      if (valid()) status.textContent = snapshot ? t('更新失敗，顯示上次天氣；稍後重試。') : t('無法取得天氣，請檢查網路後重試。');
    } finally {
      if (token === revision) {
        running = false; render();
        schedule(snapshot && freshWeather(snapshot) ? snapshot.fetchedAt + WEATHER_INTERVAL - Date.now() : WEATHER_INTERVAL);
      }
    }
  }
  async function choose(next: WeatherLocation) {
    if (saving) return;
    saving = true; render();
    try {
      await writeStorage('weatherLocation', next);
      cancel(); location = next; snapshot = undefined; setGpsTimezone(undefined);
      form.hidden = true; status.textContent = t('正在讀取天氣…');
    } catch { status.textContent = t('設定無法儲存，請稍後重試。'); }
    finally { saving = false; render(); void refresh(); }
  }
  function editGps() {
    const point = coordinates(location);
    latitude.value = location.kind === 'gps' ? String(point.latitude) : '';
    longitude.value = location.kind === 'gps' ? String(point.longitude) : '';
    form.hidden = false; render(); latitude.focus();
  }
  el('weather-gps-edit').addEventListener('click', editGps);
  picker.addEventListener('change', () => {
    if (picker.value === 'gps') {
      editGps();
    } else { form.hidden = true; void choose({ kind: 'city', id: picker.value }); }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const next = latitude.value.trim() && longitude.value.trim() ? parseLocation({ kind: 'gps', latitude: Number(latitude.value), longitude: Number(longitude.value) }) : undefined;
    if (!next) { status.textContent = t('請輸入有效座標：緯度 −90～90，經度 −180～180。'); render(); return; }
    void choose(next);
  });
  el('weather-gps-cancel').addEventListener('click', () => { form.hidden = true; render(); });
  district.addEventListener('change', () => {
    if (location.kind === 'city') void choose({ kind: 'city', id: location.id, townId: district.value });
  });
  // Location controls stay in Settings; the calendar only displays the saved place.
  const locationDialog = el<HTMLDialogElement>('weather-settings-dialog');
  el('weather-settings-open').addEventListener('click', () => {
    el<HTMLDialogElement>('settings-dialog').close();
    locationDialog.showModal();
  });
  refreshButton.addEventListener('click', () => void refresh(true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel(); else void refresh();
  });
  window.addEventListener('focus', () => void refresh());
  window.addEventListener('calendarcontextchange', () => {
    if (!ready) return;
    if (!needsWeather()) cancel(); else void refresh();
  });
  async function loadLocation() {
    cancel(); ready = false;
    const token = revision;
    try { location = parseLocation(await readStorage('weatherLocation')) ?? defaultLocation; } catch { location = defaultLocation; }
    if (token !== revision) return;
    snapshot = undefined;
    try { snapshot = parseWeather(await readStorage('weatherCache'), locationKey(location)); } catch { /* No cached data. */ }
    if (token !== revision) return;
    setGpsTimezone(snapshot?.timezone); ready = true;
    if (snapshot && freshWeather(snapshot)) showTimestamp();
    else status.textContent = snapshot ? t('顯示上次天氣，等待更新。') : t('正在讀取天氣…');
    render(); void refresh();
  }
  if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.weatherLocation && !saving) void loadLocation(); });
  else window.addEventListener('storage', event => { if (event.key === 'weatherLocation' || event.key === null) void loadLocation(); });
  void loadLocation();
  return { setVisible(value: boolean) {
    if (visible === value) return;
    visible = value; panel.hidden = !value;
    if (!needsWeather()) cancel(); else void refresh();
  } };
}
