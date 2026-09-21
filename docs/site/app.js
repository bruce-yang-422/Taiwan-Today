import { convertRows } from '../../src/calendar/historyRows.js';

const file = document.querySelector('#history-file');
const sheetField = document.querySelector('#sheet-field');
const sheetSelect = document.querySelector('#history-sheet');
const status = document.querySelector('#conversion-status');
const preview = document.querySelector('#conversion-preview');
const download = document.querySelector('#download-json');
let worker, timer, sheets = [], output = '', revision = 0;

function clear() {
  output = '';
  download.disabled = true;
  preview.replaceChildren();
}
function render() {
  clear();
  const sheet = sheets[Number(sheetSelect.value)];
  if (!sheet) return;
  if (sheet.error) { status.textContent = sheet.error; return; }
  const result = convertRows(sheet.rows);
  if (result.errors.length) {
    status.textContent = '請修正表格後再選一次檔案：' + result.errors.slice(0, 5).join('；');
    return;
  }
  output = JSON.stringify(result.records, null, 2);
  if (new Blob([output]).size > 5 * 1024 * 1024) {
    output = ''; status.textContent = '轉換後的檔案太大，請減少紀事再試一次。'; return;
  }
  status.textContent = `已整理好 ${result.records.length} 筆紀事，確認下方預覽後即可下載。`;
  for (const record of result.records.slice(0, 5)) {
    const item = document.createElement('li');
    item.textContent = `${record.year} 年 ${record.date} · ${record.region}｜${record.title} — ${record.summary}`;
    preview.append(item);
  }
  download.disabled = false;
}
file.addEventListener('change', async () => {
  const current = ++revision;
  worker?.terminate(); clearTimeout(timer); clear(); sheets = [];
  sheetField.hidden = true; sheetSelect.replaceChildren();
  const selected = file.files[0];
  if (!selected) { status.textContent = '選擇填好的表格，網站會幫你整理成日曆檔案。'; return; }
  if (!/\.(csv|xlsx|ods)$/i.test(selected.name)) { status.textContent = '請選擇 CSV、Excel（XLSX）或 ODS 表格。'; return; }
  if (selected.size > 5 * 1024 * 1024) { status.textContent = '檔案太大，請使用 5 MB 以內的表格。'; return; }
  status.textContent = '正在整理你的紀事…';
  try {
    const bytes = await selected.arrayBuffer();
    if (current !== revision) return;
    worker = new Worker(new URL('./converter-worker.js', import.meta.url));
    const active = worker;
    const fail = () => {
      active.terminate(); clearTimeout(timer);
      if (current === revision) { clear(); status.textContent = '檔案無法讀取，請試著另存一份較小的表格。'; }
    };
    timer = setTimeout(fail, 15000);
    active.onerror = fail;
    active.onmessage = ({ data }) => {
      active.terminate(); clearTimeout(timer);
      if (current !== revision) return;
      if (data.error) { status.textContent = data.error; return; }
      sheets = data.sheets;
      sheets.forEach((sheet, index) => sheetSelect.add(new Option(sheet.name, String(index))));
      sheetField.hidden = sheets.length < 2;
      render();
    };
    active.postMessage({ bytes, csv: /\.csv$/i.test(selected.name) }, [bytes]);
  } catch { if (current === revision) { clear(); status.textContent = '無法讀取檔案，請重新選擇。'; } }
});
sheetSelect.addEventListener('change', render);
download.addEventListener('click', () => {
  if (!output) return;
  const url = URL.createObjectURL(new Blob([output], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'history-personal.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
