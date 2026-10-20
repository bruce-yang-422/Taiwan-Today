import taiwanLocations from './taiwan-locations.json';
export const WEATHER_INTERVAL = 10 * 60 * 1000;
export const cities = taiwanLocations.cities;
export function cityTown(location: Extract<WeatherLocation, { kind: 'city' }>) {
  const city = cities.find(city => city.id === location.id)!;
  const town = city.towns.find(town => town.id === (location.townId ?? city.defaultTown))!;
  return { city, town };
}

export type WeatherLocation = { kind: 'city'; id: string; townId?: string } | { kind: 'gps'; latitude: number; longitude: number };
export const defaultLocation: WeatherLocation = { kind: 'city', id: 'taipei' };
export function parseLocation(value: unknown): WeatherLocation | undefined {
  if (!value || typeof value !== 'object') return;
  const v = value as Record<string, unknown>;
  if (v.kind === 'city') {
    const city = cities.find(city => city.id === v.id);
    if (!city || (v.townId !== undefined && !city.towns.some(town => town.id === v.townId))) return;
    return { kind: 'city', id: city.id, townId: typeof v.townId === 'string' ? v.townId : city.defaultTown };
  }
  if (v.kind === 'gps' && typeof v.latitude === 'number' && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90
    && typeof v.longitude === 'number' && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180) {
    return { kind: 'gps', latitude: Number(v.latitude.toFixed(5)), longitude: Number(v.longitude.toFixed(5)) };
  }
}
export function coordinates(location: WeatherLocation) {
  if (location.kind === 'gps') return location;
  return cityTown(location).town;
}
export function locationKey(location: WeatherLocation) {
  const { latitude, longitude } = coordinates(location);
  return `${latitude},${longitude}`;
}
export function weatherUrl(location: WeatherLocation) {
  const { latitude, longitude } = coordinates(location);
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude),
    current: 'temperature_2m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '2', temperature_unit: 'celsius', timezone: location.kind === 'city' ? 'Asia/Taipei' : 'auto' });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export const conditions: Record<number, { name: string; symbol: string }> = {
  0: { name: '晴', symbol: '☀' }, 1: { name: '晴時多雲', symbol: '🌤' }, 2: { name: '多雲', symbol: '⛅' }, 3: { name: '陰', symbol: '☁' },
  45: { name: '霧', symbol: '🌫' }, 48: { name: '霧淞', symbol: '🌫' },
  51: { name: '小毛毛雨', symbol: '🌦' }, 53: { name: '毛毛雨', symbol: '🌦' }, 55: { name: '強毛毛雨', symbol: '🌧' },
  56: { name: '小凍毛毛雨', symbol: '🌧' }, 57: { name: '強凍毛毛雨', symbol: '🌧' },
  61: { name: '小雨', symbol: '🌦' }, 63: { name: '中雨', symbol: '🌧' }, 65: { name: '大雨', symbol: '🌧' },
  66: { name: '小凍雨', symbol: '🌧' }, 67: { name: '強凍雨', symbol: '🌧' },
  71: { name: '小雪', symbol: '🌨' }, 73: { name: '中雪', symbol: '🌨' }, 75: { name: '大雪', symbol: '❄' }, 77: { name: '雪粒', symbol: '❄' },
  80: { name: '小陣雨', symbol: '🌦' }, 81: { name: '陣雨', symbol: '🌧' }, 82: { name: '強陣雨', symbol: '🌧' },
  85: { name: '小陣雪', symbol: '🌨' }, 86: { name: '強陣雪', symbol: '🌨' },
  95: { name: '雷雨', symbol: '⛈' }, 96: { name: '雷雨伴小冰雹', symbol: '⛈' }, 97: { name: '強雷雨', symbol: '⛈' }, 99: { name: '雷雨伴大冰雹', symbol: '⛈' },
};

export interface WeatherSnapshot {
  key: string; fetchedAt: number; timezone: string; date: string;
  current: { time: string; temperature: number; code: number; isDay: boolean };
  tomorrow: { date: string; minimum: number; maximum: number; code: number; rain: number | null };
}
export interface WeatherCache { key: string; fetchedAt: number; payload: unknown }
const numeric = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const date = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function localDate(timezone: string, now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
}
export function parseWeather(cache: unknown, key: string): WeatherSnapshot | undefined {
  try {
    const c = cache as WeatherCache, p = c.payload as any, current = p.current, daily = p.daily;
    if (c.key !== key || !numeric(c.fetchedAt, 0, Number.MAX_SAFE_INTEGER) || typeof p.timezone !== 'string') return;
    localDate(p.timezone); // Reject invalid IANA time zones before rendering.
    if (p.current_units?.temperature_2m !== '°C' || p.daily_units?.temperature_2m_min !== '°C' || p.daily_units?.temperature_2m_max !== '°C') return;
    if (!numeric(current.temperature_2m, -100, 70) || !Number.isInteger(current.weather_code) || !conditions[current.weather_code] || ![0, 1].includes(current.is_day)) return;
    if (typeof current.time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(current.time)) return;
    if (!date(daily.time?.[0]) || !date(daily.time?.[1]) || current.time.slice(0, 10) !== daily.time[0]
      || Date.parse(daily.time[1]) - Date.parse(daily.time[0]) !== 86400000) return;
    const minimum = daily.temperature_2m_min?.[1], maximum = daily.temperature_2m_max?.[1];
    if (!numeric(minimum, -100, 70) || !numeric(maximum, -100, 70) || minimum > maximum || !conditions[daily.weather_code?.[1]]) return;
    const rain = daily.precipitation_probability_max?.[1];
    if (rain !== null && !numeric(rain, 0, 100)) return;
    return { key, fetchedAt: c.fetchedAt, timezone: p.timezone, date: daily.time[0],
      current: { temperature: current.temperature_2m, code: current.weather_code, time: current.time, isDay: current.is_day === 1 },
      tomorrow: { date: daily.time[1], minimum, maximum, code: daily.weather_code[1], rain } };
  } catch { return; }
}
export function freshWeather(snapshot: WeatherSnapshot, now = Date.now()) {
  return now >= snapshot.fetchedAt && now - snapshot.fetchedAt < WEATHER_INTERVAL && localDate(snapshot.timezone, now) === snapshot.date;
}
export async function fetchWeather(location: WeatherLocation, signal: AbortSignal): Promise<WeatherCache> {
  const response = await fetch(weatherUrl(location), { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'error' });
  if (!response.ok) throw new Error('Weather request failed');
  const cache = { key: locationKey(location), fetchedAt: Date.now(), payload: await response.json() };
  const snapshot = parseWeather(cache, cache.key);
  if (!snapshot || !freshWeather(snapshot)) throw new Error('Invalid weather response');
  return cache;
}
