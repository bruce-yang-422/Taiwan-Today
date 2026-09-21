import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const context = { exports: {} };
runInNewContext(readFileSync(new URL('vendor/sheetjs/xlsx.full.min.js', root), 'utf8'), context);
const XLSX = context.exports;
const rows = [
  ['日期', '年份', '標題', '摘要', '分類', '關鍵字', '來源', '來源網址'],
  ['09-21', 2010, '搬進第一個家', '一起整理紙箱、煮第一頓晚餐。', '家族', '', '家庭相簿', ''],
  ['06-15', 2018, '大學畢業', '和家人一起留下畢業合照。', '個人', '', '私人紀事', ''],
];
const folder = new URL('templates/', root);
mkdirSync(folder, { recursive: true });
const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
writeFileSync(new URL('history-template.csv', folder), '\uFEFF' + csv + '\r\n');
const sheet = XLSX.utils.aoa_to_sheet(rows);
sheet['!cols'] = [12, 10, 24, 52, 10, 20, 20, 36].map(wch => ({ wch }));
const book = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(book, sheet, '我的紀事');
for (const bookType of ['xlsx', 'ods']) {
  const bytes = XLSX.write(book, { type: 'array', bookType });
  writeFileSync(new URL(`history-template.${bookType}`, folder), new Uint8Array(bytes));
  const parsed = XLSX.read(bytes, { type: 'array', raw: true });
  const restored = XLSX.utils.sheet_to_json(parsed.Sheets[parsed.SheetNames[0]], { header: 1, defval: '' });
  if (JSON.stringify(restored) !== JSON.stringify(rows)) throw new Error(`${bookType} 範例驗證失敗`);
}
console.log('已建立並驗證 CSV、XLSX、ODS 個人紀事範例。');
