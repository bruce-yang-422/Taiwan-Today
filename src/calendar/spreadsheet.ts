import libraryUrl from '../../vendor/sheetjs/xlsx.full.min.js?url';
import { convertRows } from './historyRows.js';
import { parsePersonalHistory } from './personalHistory';

export interface HistorySheet { name: string; rows?: unknown[][]; error?: string }
export function readHistoryWorkbook(bytes: ArrayBuffer): Promise<HistorySheet[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./spreadsheet.worker.ts', import.meta.url));
    const finish = () => { clearTimeout(timer); worker.terminate(); };
    const timer = setTimeout(() => { finish(); reject(new Error('試算表讀取逾時，請減少內容或改存 CSV 後再試。')); }, 15000);
    worker.onerror = () => { finish(); reject(new Error('無法讀取試算表，請確認檔案沒有損毀或加密。')); };
    worker.onmessage = event => {
      finish();
      if (event.data.error) reject(new Error(`無法讀取試算表：${event.data.error}`));
      else resolve(event.data.sheets);
    };
    worker.postMessage({ bytes, libraryUrl: new URL(libraryUrl, location.href).href }, [bytes]);
  });
}
export function parseHistorySheet(sheet: HistorySheet) {
  if (sheet.error) throw new Error(sheet.error);
  const result = convertRows(sheet.rows ?? []);
  if (result.errors.length) throw new Error(result.errors.slice(0, 5).join('\n'));
  return parsePersonalHistory(result.records);
}
