import { parsePersonalHistory } from '../calendar/personalHistory';
import { parsePersonalHistoryFile } from '../calendar/personalHistoryFile';
import { readHistoryWorkbook, parseHistorySheet, type HistorySheet } from '../calendar/spreadsheet';
import { setPersonalHistory } from '../calendar/dailyCalendar';
import { historyDatasets, type HistoryEntry } from '../calendar/history';
import { readStorage, writeStorage, extensionStorage } from '../shortcuts/storage';

export function initializePersonalHistory(refresh: () => void) {
  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const dialog = el<HTMLDialogElement>('personal-history-dialog');
  const file = el<HTMLInputElement>('personal-history-file');
  const save = el<HTMLButtonElement>('personal-history-save');
  const exportButton = el<HTMLButtonElement>('personal-history-export');
  const status = el<HTMLParagraphElement>('personal-history-status');
  const preview = el<HTMLUListElement>('personal-history-preview');
  const sheetPicker = el<HTMLSelectElement>('personal-history-sheet');
  const sheetField = el('personal-history-sheet-field');
  let sheets: HistorySheet[] = [];
  let current: readonly HistoryEntry[] = [], pending: HistoryEntry[] | undefined;
  let ready = false, busy = false, revision = 0, loadRevision = 0;
  function controls() { file.disabled = busy || !ready; sheetPicker.disabled = busy || !ready; save.disabled = busy || !ready || pending === undefined; exportButton.disabled = busy || !ready; }
  function showPreview(entries: HistoryEntry[]) {
    pending = entries; preview.replaceChildren();
    for (const entry of entries.slice(0, 5)) { const li = document.createElement('li'); li.textContent = `${entry.year}-${entry.date} · ${entry.title}`; preview.append(li); }
    status.textContent = `已驗證 ${entries.length} 筆。按「匯入並取代」會取代目前的個人紀事${entries.length ? '，公共歷史資料不受影響。' : '並清空清單。'}`;
  }
  sheetPicker.onchange = () => {
    pending = undefined; preview.replaceChildren();
    try { showPreview(parseHistorySheet(sheets[Number(sheetPicker.value)])); }
    catch (error) { status.textContent = error instanceof Error ? error.message : '工作表讀取失敗。'; }
    controls();
  };
  function apply(value: unknown) {
    const parsed = value === undefined ? undefined : parsePersonalHistory(value);
    current = parsed ?? historyDatasets.find(d => d.id === 'personal')!.entries;
    setPersonalHistory(parsed); ready = true;
    el('personal-history-count').textContent = `目前 ${current.length} 筆個人／家族紀事`;
    controls(); refresh();
  }
  async function load() {
    const token = ++loadRevision;
    try { const value = await readStorage('personalHistory'); if (token === loadRevision) apply(value); }
    catch { if (token === loadRevision) { status.textContent = '無法讀取已儲存的個人紀事，請重新整理後再試。'; ready = false; controls(); } }
  }
  el<HTMLButtonElement>('personal-history-open').onclick = () => { el<HTMLDialogElement>('settings-dialog').close(); dialog.showModal(); };
  file.onchange = async () => {
    const token = ++revision; pending = undefined; sheets = []; sheetPicker.replaceChildren(); sheetField.hidden = true; preview.replaceChildren(); controls();
    const selected = file.files?.[0]; if (!selected) { status.textContent = '請選擇 CSV、XLSX、ODS 或 JSON 檔案。'; return; }
    try {
      if (selected.size > 5 * 1024 * 1024) throw new Error('檔案不得超過 5 MB。');
      status.textContent = '正在讀取檔案…';
      if (/\.(xlsx|ods)$/i.test(selected.name)) {
        const bytes = await selected.arrayBuffer(); if (token !== revision) return;
        const loaded = await readHistoryWorkbook(bytes); if (token !== revision) return;
        sheets = loaded;
        sheets.forEach((sheet, index) => sheetPicker.add(new Option(sheet.name, String(index))));
        sheetField.hidden = false;
        showPreview(parseHistorySheet(sheets[0]));
      } else {
      const content = await selected.text(); if (token !== revision) return;
      const entries = parsePersonalHistoryFile(selected.name, content);
      showPreview(entries);
      }
    } catch (error) { if (token !== revision) return; status.textContent = error instanceof SyntaxError ? 'JSON 格式錯誤，請確認檔案內容。' : error instanceof Error ? error.message : '讀取失敗。'; }
    controls();
  };
  save.onclick = async () => {
    if (!ready || busy || pending === undefined) return;
    const entries = pending; busy = true; controls();
    try {
      await writeStorage('personalHistory', entries);
      ++loadRevision; apply(entries); pending = undefined; file.value = ''; preview.replaceChildren();
      sheets = []; sheetPicker.replaceChildren(); sheetField.hidden = true;
      status.textContent = `已匯入 ${entries.length} 筆，已儲存在本機。`;
    } catch { status.textContent = '儲存失敗（可能空間不足）；原有紀事仍保留，可重新嘗試。'; }
    finally { busy = false; controls(); }
  };
  exportButton.onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(current, null, 2) + '\n'], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'history-personal.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (extensionStorage()) chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.personalHistory) void load(); });
  else window.addEventListener('storage', event => { if (event.key === 'personalHistory' || event.key === null) void load(); });
  controls(); void load();
}
