import { parse } from 'csv-parse/browser/esm/sync';
import { convertRows } from './historyRows.js';
import { parsePersonalHistory } from './personalHistory';

export function parsePersonalHistoryFile(name: string, content: string) {
  if (/\.json$/i.test(name)) return parsePersonalHistory(JSON.parse(content.replace(/^\uFEFF/, '')));
  if (!/\.csv$/i.test(name)) throw new Error('請選擇 CSV 或 JSON 檔案。');
  if (content.includes('\uFFFD')) throw new Error('CSV 編碼無法辨識，請另存為「CSV UTF-8」後再試。');
  let rows: string[][];
  try {
    rows = parse(content, { bom: true, relax_column_count: true, skip_empty_lines: true, max_record_size: 100000 });
  } catch {
    throw new Error('CSV 格式無法讀取，請檢查引號是否成對，或重新另存為「CSV UTF-8」。');
  }
  if (rows.some(row => row.length > 64)) throw new Error('CSV 最多接受 64 欄。');
  const result = convertRows(rows);
  if (result.errors.length) throw new Error(result.errors.slice(0, 5).join('\n'));
  return parsePersonalHistory(result.records);
}
