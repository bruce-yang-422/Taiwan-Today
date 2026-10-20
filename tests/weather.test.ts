import { afterEach, describe, expect, it } from 'vitest';
import { calendarDate, calendarNoon, calendarTimezone, clockTimezone, defaultContext, setCalendarContext, setGpsTimezone } from '../src/calendar/context';
import { dailyCalendar } from '../src/calendar/dailyCalendar';
import { cities, conditions, coordinates, freshWeather, locationKey, parseLocation, parseWeather, WEATHER_INTERVAL, weatherUrl } from '../src/weather/weather';

afterEach(() => { setCalendarContext(defaultContext); setGpsTimezone(undefined); });
const now = Date.parse('2026-10-20T08:00:00Z');
const payload = () => ({ timezone: 'Asia/Taipei', current_units: { temperature_2m: '°C' }, daily_units: { temperature_2m_min: '°C', temperature_2m_max: '°C' },
  current: { time: '2026-10-20T16:00', temperature_2m: 26.4, weather_code: 2, is_day: 1 },
  daily: { time: ['2026-10-20', '2026-10-21'], weather_code: [2, 61], temperature_2m_min: [23, 22], temperature_2m_max: [28, 27], precipitation_probability_max: [10, 40] } });

describe('weather data', () => {
  it('supports 22 distinct Taiwan counties/cities and valid manually entered GPS coordinates', () => {
    expect(cities).toHaveLength(22);
    expect(new Set(cities.map(city => city.id)).size).toBe(22);
    expect(cities.reduce((count, city) => count + city.towns.length, 0)).toBe(368);
    expect(new Set(cities.flatMap(city => city.towns.map(town => town.id))).size).toBe(368);
    for (const city of cities) {
      expect(parseLocation({ kind: 'city', id: city.id })).toEqual({ kind: 'city', id: city.id, townId: city.defaultTown });
      for (const town of city.towns) {
        const selected = { kind: 'city' as const, id: city.id, townId: town.id };
        expect(parseLocation(selected)).toEqual(selected);
        expect(coordinates(selected)).toMatchObject({ latitude: expect.any(Number), longitude: expect.any(Number) });
      }
    }
    expect(parseLocation({ kind: 'city', id: 'taipei', townId: '6501000' })).toBeUndefined();
    expect(locationKey({ kind: 'city', id: 'new-taipei', townId: '6500100' })).not.toBe(locationKey({ kind: 'city', id: 'new-taipei', townId: '6501000' }));
    expect(parseLocation({ kind: 'gps', latitude: 0, longitude: -0.1276 })).toEqual({ kind: 'gps', latitude: 0, longitude: -0.1276 });
    for (const latitude of [91, NaN, Infinity, '25', null]) expect(parseLocation({ kind: 'gps', latitude, longitude: 121 })).toBeUndefined();
    expect(parseLocation({ kind: 'gps', latitude: 25, longitude: -181 })).toBeUndefined();
    const url = new URL(weatherUrl({ kind: 'gps', latitude: 35.68, longitude: 139.76 }));
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('2');
  });
  it('rejects missing or invalid API data instead of presenting it as zero', () => {
    const key = locationKey({ kind: 'city', id: 'taipei' });
    const cache = () => ({ key, fetchedAt: now, payload: payload() });
    expect(parseWeather(cache(), key)?.tomorrow.rain).toBe(40);
    for (const mutate of [
      (p: any) => p.current.temperature_2m = null,
      (p: any) => p.daily.temperature_2m_min[1] = null,
      (p: any) => p.daily.temperature_2m_max[1] = 0,
      (p: any) => p.daily.time[1] = '2026-10-20',
      (p: any) => p.current.weather_code = 700,
      (p: any) => p.timezone = 'Invalid/Timezone',
      (p: any) => p.current_units.temperature_2m = '°F',
    ]) { const value = cache(); mutate(value.payload); expect(parseWeather(value, key)).toBeUndefined(); }
    expect(conditions[99].name).toBe('雷雨伴大冰雹');
  });
  it('expires at ten minutes and at the forecast location midnight', () => {
    const key = 'test', value = parseWeather({ key, fetchedAt: now, payload: payload() }, key)!;
    expect(freshWeather(value, now + WEATHER_INTERVAL - 1)).toBe(true);
    expect(freshWeather(value, now + WEATHER_INTERVAL)).toBe(false);
    value.fetchedAt = Date.parse('2026-10-20T15:58:00Z');
    expect(freshWeather(value, Date.parse('2026-10-20T16:01:00Z'))).toBe(false);
  });
});

describe('independent calendar and clock context', () => {
  it('keeps Taiwan calendar on short trips while allowing a foreign GPS clock', () => {
    setCalendarContext({ mode: 'travel', travelClock: 'gps' });
    expect(calendarTimezone()).toBe('Asia/Taipei');
    expect(clockTimezone()).toBeUndefined();
    setGpsTimezone('America/Los_Angeles');
    expect(clockTimezone()).toBe('America/Los_Angeles');
    expect(calendarDate(new Date('2026-10-20T00:30:00Z')).key).toBe('2026-10-20');
    setCalendarContext({ mode: 'travel', travelClock: 'taiwan' });
    expect(clockTimezone()).toBe('Asia/Taipei');
  });
  it('uses local Gregorian dates abroad without Taiwan holidays, including month selection across DST', () => {
    setCalendarContext({ mode: 'international', timezone: 'America/Los_Angeles' });
    const date = dailyCalendar(new Date('2026-10-26T00:30:00Z'));
    expect(date.key).toBe('2026-10-25');
    expect(date.holiday).toBe(''); expect(date.longHoliday).toBeUndefined(); expect(date.festivals).toEqual([]);
    expect(clockTimezone()).toBe('America/Los_Angeles');
    for (const day of ['2026-03-08', '2026-11-01', '2026-10-25']) expect(calendarDate(calendarNoon(day)).key).toBe(day);
    setCalendarContext({ mode: 'international', timezone: 'Pacific/Kiritimati' });
    expect(calendarDate(calendarNoon('2026-10-20')).key).toBe('2026-10-20');
  });
});
