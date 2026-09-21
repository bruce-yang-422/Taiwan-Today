import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const records = JSON.parse(await readFile(new URL('../data/history.json', import.meta.url), 'utf8'));
const seen = new Set();
const dates = new Set();
const counts = new Map();
assert(Array.isArray(records), 'History must be an array');
for (const entry of records) {
  const context = `${entry.date}: ${entry.title}`;
  for (const field of ['date', 'title', 'summary', 'keyword', 'source', 'sourceUrl']) {
    assert(typeof entry[field] === 'string' && entry[field].trim(), `${context}: missing ${field}`);
  }
  assert(/^\d{2}-\d{2}$/.test(entry.date), `${context}: invalid date format`);
  const date = new Date(`2000-${entry.date}T00:00:00Z`);
  assert(!Number.isNaN(date.getTime()) && date.toISOString().slice(5, 10) === entry.date, `${context}: invalid date`);
  assert(Number.isInteger(entry.year) && entry.year > 0, `${context}: invalid year`);
  assert(['台灣', '國際'].includes(entry.region), `${context}: invalid region`);
  assert(new URL(entry.sourceUrl).protocol === 'https:', `${context}: source must use HTTPS`);
  assert([...entry.summary].length >= 50 && [...entry.summary].length <= 100, `${context}: summary must contain 50–100 characters`);
  const key = `${entry.date}|${entry.year}|${entry.title}`;
  assert(!seen.has(key), `${context}: duplicate entry`);
  seen.add(key);
  dates.add(entry.date);
  counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1);
  assert(counts.get(entry.date) <= 3, `${context}: more than three curated events`);
}
for (const [month, count] of [[9, 30], [10, 31], [11, 30], [12, 31]]) {
  for (let day = 1; day <= count; day++) {
    const date = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    assert(dates.has(date), `Missing history for ${date}`);
  }
  console.log(`${month} 月：${count} 天皆有紀事`);
}
console.log(`共 ${records.length} 筆，欄位、日期、摘要長度、來源網址格式與重複檢查通過。`);
const taiwanCount = records.filter(entry => entry.region === '台灣').length;
console.log(`台灣 ${taiwanCount} 筆（${(taiwanCount / records.length * 100).toFixed(2)}%）；國際 ${records.length - taiwanCount} 筆。`);
