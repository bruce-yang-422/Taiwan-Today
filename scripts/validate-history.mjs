import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = async name => {
  const value = JSON.parse(await readFile(new URL(`../data/history-${name}.json`, import.meta.url), 'utf8'));
  return value.data ?? value;
};
const taiwan = await load('taiwan'), world = await load('world'), personal = await load('personal');
assert(Array.isArray(taiwan) && taiwan.every(e => e.region === '台灣'), 'Taiwan file must contain Taiwan entries');
assert(Array.isArray(world) && world.every(e => e.region === '國際'), 'World file must contain international entries');
const records = [...taiwan, ...world];
assert(Array.isArray(personal), 'Personal history must be an array');
const privateSeen = new Set();
for (const item of personal) {
  assert(typeof item.date === 'string' && /^\d{2}-\d{2}$/.test(item.date), 'Invalid personal date');
  assert(Number.isInteger(item.year) && item.year >= 1 && item.year <= 9999, 'Invalid personal year');
  const stamp = `${String(item.year).padStart(4, '0')}-${item.date}`;
  const date = new Date(`${stamp}T00:00:00Z`);
  assert(!Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === stamp, 'Invalid personal calendar date');
  for (const field of ['title', 'summary']) assert(typeof item[field] === 'string' && item[field].trim(), `Missing personal ${field}`);
  assert(['個人', '家族', '台灣', '國際'].includes(item.region), 'Invalid personal region');
  for (const field of ['keyword', 'source', 'sourceUrl']) assert(item[field] === undefined || typeof item[field] === 'string', `Invalid personal ${field}`);
  if (item.sourceUrl) { const url = new URL(item.sourceUrl); assert(url.protocol === 'https:' && !url.username && !url.password, 'Invalid personal source URL'); }
  const key = `${item.date}|${item.year}|${item.title}`;
  assert(!privateSeen.has(key), 'Duplicate personal entry'); privateSeen.add(key);
}
console.log(`個人／家族紀事：${personal.length} 筆驗證通過`);
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

// Topic packs share the same entry shape but are not required to cover every day, and use their own region value.
for (const [name, region] of [['tech', '科技'], ['entertainment', '影音娛樂']]) {
  const topic = await load(name);
  assert(Array.isArray(topic) && topic.every(e => e.region === region), `${name} file must use region "${region}"`);
  const topicSeen = new Set();
  const topicCounts = new Map();
  for (const entry of topic) {
    const context = `${name} ${entry.date}: ${entry.title}`;
    for (const field of ['date', 'title', 'summary', 'keyword', 'source', 'sourceUrl']) {
      assert(typeof entry[field] === 'string' && entry[field].trim(), `${context}: missing ${field}`);
    }
    assert(/^\d{2}-\d{2}$/.test(entry.date), `${context}: invalid date format`);
    const date = new Date(`2000-${entry.date}T00:00:00Z`);
    assert(!Number.isNaN(date.getTime()) && date.toISOString().slice(5, 10) === entry.date, `${context}: invalid date`);
    assert(Number.isInteger(entry.year) && entry.year > 0, `${context}: invalid year`);
    assert(new URL(entry.sourceUrl).protocol === 'https:', `${context}: source must use HTTPS`);
    assert([...entry.summary].length >= 50 && [...entry.summary].length <= 100, `${context}: summary must contain 50–100 characters`);
    const key = `${entry.date}|${entry.year}|${entry.title}`;
    assert(!topicSeen.has(key), `${context}: duplicate entry`);
    topicSeen.add(key);
    topicCounts.set(entry.date, (topicCounts.get(entry.date) ?? 0) + 1);
    assert(topicCounts.get(entry.date) <= 3, `${context}: more than three curated events`);
  }
  console.log(`${region}主題：${topic.length} 筆驗證通過`);
}
