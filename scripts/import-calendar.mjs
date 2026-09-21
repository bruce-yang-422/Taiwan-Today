import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { Solar } from 'lunar-typescript';

// npm run data:import -- --year 2027 [--csv path/to/official.csv]
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--year', '--csv'].includes(args[i]) || !args[i + 1]) throw new Error('用法：npm run data:import -- --year 2027 [--csv 官方CSV路徑]');
  options[args[i]] = args[i + 1];
}
const year = Number(options['--year'] ?? 2027);
if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error('年份必須介於 1900 與 2100');
const readDocument = path => JSON.parse(readFileSync(path, 'utf8'));
const read = path => { const value = readDocument(path); return value.data ?? value; };
const output = `data/calendar-${year}.json`;
const previous = existsSync(output) ? read(output).days : {};
const holidays = read('data/holidays.json').dates;
const periods = read('data/long-holidays.json').periods;
const count = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
const rows = options['--csv'] ? parse(readFileSync(options['--csv'], 'utf8'), { columns: true, bom: true, skip_empty_lines: true }) : undefined;
if (rows && rows.length !== count) throw new Error(`官方 CSV 必須包含完整 ${count} 天`);
const normalize = text => text.replaceAll('惊', '驚').replaceAll('蛰', '蟄').replaceAll('谷', '穀').replaceAll('满', '滿').replaceAll('种', '種').replaceAll('处', '處');
const months = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];
const days = {};
for (let index = 0; index < count; index++) {
  const date = new Date(Date.UTC(year, 0, index + 1));
  const key = date.toISOString().slice(0, 10);
  const row = rows?.[index];
  if (row && (row['西元日期'] !== key.replaceAll('-', '') || row['星期'] !== '日一二三四五六'[date.getUTCDay()] || !['0', '2'].includes(row['是否放假']))) throw new Error(`${key}：CSV 日期、星期或放假欄位錯誤`);
  const isDayOff = row ? row['是否放假'] === '2' : previous[key]?.isDayOff;
  if (typeof isDayOff !== 'boolean') throw new Error(`${key} 缺少官方放假資料，請用 --csv 提供該年官方 CSV`);
  const lunar = Solar.fromYmd(year, date.getUTCMonth() + 1, date.getUTCDate()).getLunar();
  const month = Math.abs(lunar.getMonth());
  const alias = month === 1 ? '（正月）' : month === 11 ? '（冬月）' : month === 12 ? '（臘月）' : '';
  const period = periods.find(p => key >= p.start && key <= p.end);
  if (period && (!isDayOff || (Date.parse(period.end) - Date.parse(period.start)) / 86400000 + 1 !== period.days)) throw new Error(`${key} 連假資料與官方放假不符`);
  const holiday = holidays[key] ?? (row?.['備註'] || '');
  if (holiday && !isDayOff) throw new Error(`${key} 節日放假資料與官方 CSV 不符`);
  days[key] = {
    lunar: `${lunar.getMonth() < 0 ? '閏' : ''}${months[month - 1]}月${alias}${lunar.getDayInChinese()}`,
    solarTerm: normalize(lunar.getJieQi()), isDayOff, holiday,
    ...(period ? { longHoliday: period.name, holidayDayIndex: (Date.parse(key) - Date.parse(period.start)) / 86400000 + 1, holidayDays: period.days } : {}),
  };
}
const termCount = Object.values(days).filter(d => d.solarTerm).length;
if (termCount !== 24) throw new Error(`節氣數量錯誤：${termCount}`);
const version = existsSync(output) ? readDocument(output).version ?? '1.0.0' : '1.0.0';
const updatedAt = existsSync(output) ? readDocument(output).updatedAt : undefined;
writeFileSync(output, JSON.stringify({ version, ...(updatedAt ? { updatedAt } : {}), data: { year, days } }, null, 2) + '\n');
console.log(`${output}: ${count} days, ${termCount} solar terms, ${Object.values(days).filter(d => d.isDayOff).length} official days off.`);
