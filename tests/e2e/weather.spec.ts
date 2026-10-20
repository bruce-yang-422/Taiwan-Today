import { test, expect, type Page } from '@playwright/test';

function forecast(zone = 'Asia/Taipei') {
  return { timezone: zone, current_units: { temperature_2m: '°C' }, daily_units: { temperature_2m_min: '°C', temperature_2m_max: '°C' },
    current: { time: zone === 'America/Los_Angeles' ? '2026-10-19T17:30' : '2026-10-20T08:30', temperature_2m: 26.4, weather_code: 2, is_day: 1 },
    daily: { time: zone === 'America/Los_Angeles' ? ['2026-10-19', '2026-10-20'] : ['2026-10-20', '2026-10-21'], weather_code: [2, 61], temperature_2m_min: [23, 22], temperature_2m_max: [28, 27], precipitation_probability_max: [10, 40] } };
}
async function prepare(page: Page) {
  await page.clock.install({ time: new Date('2026-10-20T00:30:00Z') });
  await page.addInitScript(() => {
    if (!localStorage.getItem('preferences')) localStorage.setItem('preferences', JSON.stringify({ style: 'traditional' }));
  });
}
async function openWeatherSettings(page: Page) {
  await page.locator('#settings-open').click();
  await page.locator('#weather-settings-open').click();
}
async function enterGps(page: Page) {
  await openWeatherSettings(page);
  await page.locator('#weather-location').selectOption('gps');
  await page.locator('#weather-latitude').fill('34.0522');
  await page.locator('#weather-longitude').fill('-118.2437');
  await page.locator('#weather-gps-form button[type=submit]').click();
  await expect(page.locator('#weather-coordinate')).toHaveText('34.0522, -118.2437');
  await page.locator('#weather-settings-dialog [data-close]').click();
}

test('paper header, compact date details and two-day weather fit desktop and mobile', async ({ page }) => {
  await prepare(page);
  await page.route('https://api.open-meteo.com/**', route => route.fulfill({ json: forecast() }));
  await page.goto('/newtab.html');
  await expect(page.locator('#weather-now-temperature')).toHaveText('26°C');
  await expect(page.locator('#weather-next-temperature')).toHaveText('22–27°C');
  await expect(page.locator('#weather-rain')).toHaveText('降雨 40%');
  await expect(page.locator('#weather-location option')).toHaveCount(23);
  await expect(page.locator('#paper-weather select')).toHaveCount(0);
  await expect(page.locator('#weather-location-name')).toHaveText('臺北市 信義區');
  for (const [width, height] of [[3840,1822], [2560,1214], [1920,1080], [1366,768], [360,800]]) {
    await page.setViewportSize({ width, height });
    const box = async (selector: string) => (await page.locator(selector).boundingBox())!;
    const month = await box('#month'), mini = await box('#paper-mini-calendar'), day = await box('#day'), weekday = await box('#weekday'), lunar = await box('#lunar'), weather = await box('#paper-weather');
    expect(month.x + month.width).toBeLessThanOrEqual(mini.x);
    expect(month.y).toBeLessThan(mini.y + mini.height);
    expect(mini.y + mini.height).toBeLessThanOrEqual(day.y);
    expect(weekday.y).toBeGreaterThanOrEqual(day.y + day.height - 1);
    expect(weekday.y - day.y - day.height).toBeLessThan(20);
    expect(lunar.y).toBeLessThan(weather.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/weather-paper-${width}.png`, fullPage: true });
  }
});

test('weather refreshes after ten minutes, shares cache, persists cities and keeps stale data on error', async ({ page, context }) => {
  await prepare(page); let requests = 0, offline = false;
  await context.route('https://api.open-meteo.com/**', route => {
    requests++;
    return offline ? route.abort() : route.fulfill({ json: forecast() });
  });
  await page.goto('/newtab.html');
  await expect(page.locator('#weather-now-temperature')).toHaveText('26°C');
  expect(requests).toBe(1);
  await page.reload(); await expect(page.locator('#weather-now-temperature')).toHaveText('26°C');
  expect(requests).toBe(1);
  await page.clock.fastForward(10 * 60 * 1000);
  await expect.poll(() => requests).toBe(2);
  await openWeatherSettings(page);
  await page.locator('#weather-location').selectOption('tainan');
  await expect.poll(() => requests).toBe(3);
  await page.locator('#weather-settings-dialog [data-close]').click();
  await page.reload(); await expect(page.locator('#weather-location')).toHaveValue('tainan');
  await expect(page.locator('#weather-now-temperature')).toHaveText('26°C');
  offline = true; await page.locator('#weather-refresh').click();
  await expect(page.locator('#weather-status')).toContainText('更新失敗');
  await expect(page.locator('#weather-now-temperature')).toHaveText('26°C');
  await page.locator('#settings-open').click();
  await page.locator('#calendar-style').selectOption('modern');
  await page.keyboard.press('Escape');
  const before = requests;
  await page.clock.fastForward(20 * 60 * 1000);
  expect(requests).toBe(before);
});

test('short trips retain Taiwan calendar while GPS clock and overseas calendar use local dates', async ({ page }) => {
  await prepare(page);
  await page.route('https://api.open-meteo.com/**', route => route.fulfill({ json: forecast(new URL(route.request().url()).searchParams.get('longitude') === '-118.2437' ? 'America/Los_Angeles' : 'Asia/Taipei') }));
  await page.goto('/newtab.html');
  await enterGps(page);
  await expect(page.locator('#weather-status')).toContainText('更新');
  await expect(page.locator('#day')).toHaveText('20');
  await page.locator('#settings-open').click();
  await page.locator('#calendar-mode').selectOption('travel');
  await page.locator('#travel-clock').selectOption('gps');
  await page.keyboard.press('Escape');
  await expect(page.locator('#digital-clock')).toHaveText(/17:30:/);
  await expect(page.locator('.clock-caption')).toContainText('America/Los_Angeles');
  await expect(page.locator('#day')).toHaveText('20');
  await expect(page.locator('#lunar')).toBeVisible();
  await page.locator('#settings-open').click();
  await page.locator('#calendar-style').selectOption('modern');
  await page.locator('#weather-settings-open').click();
  await expect(page.locator('#weather-settings-dialog')).toBeVisible();
  await page.locator('#weather-gps-edit').click();
  await expect(page.locator('#weather-latitude')).toHaveValue('34.0522');
  await page.locator('#weather-gps-cancel').click();
  await page.locator('#weather-settings-dialog [data-close]').click();
  await expect(page.locator('#digital-clock')).toHaveText(/17:30:/);
  await page.locator('#settings-open').click();
  await page.locator('#travel-clock').selectOption('taiwan');
  await page.keyboard.press('Escape');
  await expect(page.locator('#digital-clock')).toHaveText(/08:30:/);
  await page.locator('#settings-open').click();
  await page.locator('#calendar-mode').selectOption('international');
  await page.locator('#calendar-timezone').selectOption('America/Los_Angeles');
  await page.keyboard.press('Escape');
  await expect(page.locator('#day')).toHaveText('19');
  await expect(page.locator('#year')).toHaveText('2026');
  await expect(page.locator('#lunar')).toBeHidden();
  await expect(page.locator('.season')).toBeHidden();
  await expect(page.locator('#festivals')).toBeHidden();
  await page.reload();
  await expect(page.locator('#day')).toHaveText('19');
  await expect(page.locator('#weather-location')).toHaveValue('gps');
  await page.locator('#settings-open').click();
  await expect(page.locator('#calendar-mode')).toHaveValue('international');
});

test('a slow response for the previous city cannot replace the selected GPS forecast', async ({ page }) => {
  await prepare(page);
  let release!: () => void;
  const pending = new Promise<void>(resolve => release = resolve);
  let started = false;
  await page.route('https://api.open-meteo.com/**', async route => {
    if (new URL(route.request().url()).searchParams.get('longitude') !== '-118.2437') {
      started = true; await pending;
      await route.fulfill({ json: forecast() }).catch(() => {});
    } else await route.fulfill({ json: { ...forecast('America/Los_Angeles'), current: { ...forecast('America/Los_Angeles').current, temperature_2m: 17 } } });
  });
  await page.goto('/newtab.html');
  await expect.poll(() => started).toBe(true);
  await enterGps(page);
  await expect(page.locator('#weather-now-temperature')).toHaveText('17°C');
  release();
  await expect(page.locator('#weather-location')).toHaveValue('gps');
  await expect(page.locator('#weather-now-temperature')).toHaveText('17°C');
});

test('invalid GPS is rejected and an empty offline state remains usable', async ({ page }) => {
  await prepare(page);
  await page.route('https://api.open-meteo.com/**', route => route.abort());
  await page.goto('/newtab.html');
  await expect(page.locator('#weather-status')).toContainText('無法取得天氣');
  await expect(page.locator('#weather-days')).toBeHidden();
  await openWeatherSettings(page);
  await page.locator('#weather-location').selectOption('gps');
  await page.locator('#weather-latitude').fill('95');
  await page.locator('#weather-longitude').fill('0');
  await page.locator('#weather-gps-form button[type=submit]').click();
  expect(await page.locator('#weather-latitude').evaluate((input: HTMLInputElement) => input.validity.rangeOverflow)).toBe(true);
  await page.locator('#weather-gps-cancel').click();
  await expect(page.locator('#weather-location')).toHaveValue('taipei');
  await page.locator('#weather-settings-dialog [data-close]').click();
  await expect(page.locator('#weather-refresh')).toBeEnabled();
});

test('Taiwan districts are selected in Settings, use distinct coordinates and persist', async ({ page }) => {
  await prepare(page);
  const requests: URL[] = [];
  await page.route('https://api.open-meteo.com/**', route => {
    requests.push(new URL(route.request().url()));
    return route.fulfill({ json: forecast() });
  });
  await page.goto('/newtab.html');
  await expect(page.locator('#weather-now-temperature')).toHaveText('26°C');
  await openWeatherSettings(page);
  await page.locator('#weather-location').selectOption('new-taipei');
  await expect(page.locator('#weather-district option')).toHaveCount(29);
  await expect(page.locator('#weather-district')).toHaveValue('6500100');
  await expect.poll(() => requests.length).toBe(2);
  const banqiao = requests[1].searchParams.get('latitude');
  await page.locator('#weather-district').selectOption('6501000');
  await expect(page.locator('#weather-location-name')).toHaveText('新北市 淡水區');
  await expect.poll(() => requests.length).toBe(3);
  expect(requests[2].searchParams.get('latitude')).not.toBe(banqiao);
  await page.locator('#weather-settings-dialog [data-close]').click();
  await page.reload();
  await expect(page.locator('#weather-location-name')).toHaveText('新北市 淡水區');
  await openWeatherSettings(page);
  await expect(page.locator('#weather-district')).toHaveValue('6501000');
  await page.screenshot({ path:'test-results/weather-settings-districts.png',fullPage:true });
  await page.setViewportSize({ width:360,height:800 });
  expect(await page.locator('#weather-settings-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.locator('#weather-settings-dialog [data-close]').click();
  await openWeatherSettings(page);
  await page.locator('#weather-location').selectOption('gps');
  await expect(page.locator('#weather-district-field')).toBeHidden();
  await expect(page.locator('#weather-latitude')).toBeVisible();
  expect(await page.locator('#weather-settings-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
});
