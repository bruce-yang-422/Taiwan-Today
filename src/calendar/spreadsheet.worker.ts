// Classic worker: parse local spreadsheets without blocking the new-tab UI.
declare function importScripts(...urls: string[]): void;
declare const XLSX: any;
globalThis.onmessage = (event: MessageEvent) => {
  try {
    importScripts(event.data.libraryUrl);
    const book = XLSX.read(event.data.bytes, { type: 'array', raw: true, cellDates: false, sheetRows: 10002 });
    if (!book.SheetNames.length) throw new Error('檔案內沒有工作表。');
    if (book.SheetNames.length > 100) throw new Error('最多接受 100 個工作表。');
    const sheets = book.SheetNames.map((name: string) => {
      const sheet = book.Sheets[name];
      const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref'] || 'A1');
      if (range.e.r >= 10001 || range.e.c > 63) return { name, error: '工作表最多 10,000 筆紀事、64 欄。' };
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '', blankrows: true });
      const dateIndex = rows[0]?.findIndex((cell: unknown) => ['日期', 'date'].includes(String(cell).trim()));
      if (dateIndex >= 0) for (const row of rows.slice(1)) {
        if (typeof row[dateIndex] !== 'number') continue;
        const date = XLSX.SSF.parse_date_code(row[dateIndex], { date1904: !!book.Workbook?.WBProps?.date1904 });
        if (date) row[dateIndex] = `${String(date.y).padStart(4, '0')}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      return { name, rows };
    });
    globalThis.postMessage({ sheets });
  } catch (error) {
    globalThis.postMessage({ error: error instanceof Error ? error.message : '無法讀取試算表。' });
  }
};
