importScripts('../../vendor/sheetjs/xlsx.full.min.js');
self.onmessage = ({ data: { bytes, csv } }) => {
  try {
    const input = csv ? new TextDecoder('utf-8', { fatal: true }).decode(bytes) : bytes;
    const book = XLSX.read(input, { type: csv ? 'string' : 'array', raw: true, cellDates: false, sheetRows: 10002 });
    if (!book.SheetNames.length || book.SheetNames.length > 100) throw Error('請使用含有紀事表格的檔案。');
    const sheets = book.SheetNames.map(name => {
      const sheet = book.Sheets[name];
      const range = XLSX.utils.decode_range(sheet['!fullref'] || sheet['!ref'] || 'A1');
      if (range.e.r >= 10001 || range.e.c > 63) return { name, error: '這張表格太大，請分成較小的檔案再試一次。' };
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '', blankrows: true });
      const column = rows[0]?.findIndex(value => ['日期', 'date'].includes(String(value).replace(/^\uFEFF/, '').trim()));
      if (column >= 0) for (const row of rows.slice(1)) {
        if (typeof row[column] !== 'number') continue;
        const date = XLSX.SSF.parse_date_code(row[column], { date1904: !!book.Workbook?.WBProps?.date1904 });
        if (date) row[column] = `${date.y}-${date.m}-${date.d}`;
      }
      return { name, rows };
    });
    self.postMessage({ sheets });
  } catch (error) {
    self.postMessage({ error: csv ? '無法讀取 CSV，請在試算表中另存為「CSV UTF-8」後再試一次。' : '無法讀取檔案，請確認檔案可在試算表中開啟，且沒有密碼保護。' });
  }
};
