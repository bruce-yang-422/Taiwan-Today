import { readFile, mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const files = ['long-holidays.json', 'holidays.json', 'calendar-2026.json', 'calendar-2027.json', 'festivals.json'];
const readJSON = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const supplements = await readJSON('scripts/calendar-data-translations.json');
const check = process.argv.includes('--check');
let outdated = false;

const months = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

// Parse the published lunar label rather than recalculating the source calendar.
function lunarLabel(value, locale) {
  const match = /^(閏?)([一二三四五六七八九十]+)月(?:（([^）]+)）)?(.+)$/.exec(value);
  const month = match ? months.indexOf(match[2]) + 1 : 0;
  const day = match ? lunarDays.indexOf(match[4]) + 1 : 0;
  if (!month || !day) throw new Error(`Unsupported lunar label: ${value}`);
  if (locale === 'ja') return `${match[1] ? '閏' : ''}${month}月${match[3] ? `（${match[3]}）` : ''}${day}日`;
  const aliases = { 正月: 'First Month', 冬月: 'Winter Month', 臘月: 'La Month' };
  if (match[3] && !aliases[match[3]]) throw new Error(`Unknown lunar alias: ${match[3]}`);
  return `${match[1] ? 'Leap month' : 'Month'} ${month}${match[3] ? ` (${aliases[match[3]]})` : ''}, day ${day}`;
}

for (const locale of ['en', 'ja']) {
  const dictionary = { ...await readJSON(`src/i18n/${locale}.json`), ...supplements[locale] };
  function translate(value) {
    if (!value) return value;
    if (Object.hasOwn(dictionary, value)) return dictionary[value];
    const holiday = /^(.*?)(補假|放假)$/.exec(value);
    if (holiday) {
      const template = dictionary[holiday[2] === '補假' ? '{0}（補假）' : '{0}（放假）'];
      return template.replace('{0}', translate(holiday[1]));
    }
    throw new Error(`Missing ${locale} translation: ${value}`);
  }

  // Prepare every file before writing so a missing translation cannot leave a partial pack.
  const outputs = [];
  for (const file of files) {
    const source = await readJSON(`data/${file}`);
    const localized = structuredClone(source), data = localized.data;
    if (file === 'festivals.json') {
      for (const festival of data) {
        festival.name = translate(festival.name);
        if (festival.description) festival.description = translate(festival.description);
        if (festival.observances) festival.observances = festival.observances.map(translate);
      }
    } else if (file === 'holidays.json') {
      data.scope = translate(data.scope);
      for (const date of Object.keys(data.dates)) data.dates[date] = translate(data.dates[date]);
    } else if (file === 'long-holidays.json') {
      data.scope = translate(data.scope);
      for (const period of data.periods) period.name = translate(period.name);
    } else {
      for (const day of Object.values(data.days)) {
        day.lunar = lunarLabel(day.lunar, locale);
        for (const key of ['solarTerm', 'holiday', 'longHoliday']) if (key in day) day[key] = translate(day[key]);
      }
    }
    const content = JSON.stringify(localized, null, 2) + '\n';
    if (locale === 'en' && /[\u3400-\u9fff]/u.test(content)) throw new Error(`Untranslated text in en/${file}`);
    outputs.push([`data/${locale}/${file}`, content]);
  }
  if (!check) await mkdir(new URL(`data/${locale}/`, root), { recursive: true });
  for (const [path, content] of outputs) {
    if (!check) await writeFile(new URL(path, root), content);
    else {
      let current;
      try { current = (await readFile(new URL(path, root), 'utf8')).replace(/\r\n/g, '\n'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (current !== content) { console.error(`Outdated: ${path}`); outdated = true; }
    }
  }
  console.log(`${locale}: ${outputs.length} calendar data files ${check ? 'checked' : 'generated'}.`);
}
if (outdated) process.exitCode = 1;
