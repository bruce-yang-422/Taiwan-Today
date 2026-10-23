import { t } from '../i18n';

/** Always respect the browser's selected search provider; never fall back to a fixed URL. */
export async function searchWeb(query: string): Promise<void> {
  const text = query.trim();
  if (!text) return;
  if (typeof chrome === 'undefined' || !chrome.search?.query) {
    throw new Error(t('搜尋功能僅適用於已安裝的 Chrome 擴充功能，請使用瀏覽器網址列搜尋。'));
  }
  try {
    await chrome.search.query({ text, disposition: 'CURRENT_TAB' as chrome.search.Disposition });
  } catch {
    throw new Error(t('無法開啟搜尋，請稍後重試或使用瀏覽器網址列。'));
  }
}

export function initializeSearch(reportError: (message: string) => void) {
  const form = document.getElementById('search-form') as HTMLFormElement;
  const input = document.getElementById('search-input') as HTMLInputElement;
  form.addEventListener('submit', event => {
    event.preventDefault();
    void searchWeb(input.value).catch(error => reportError(error.message));
  });
}

export function normalizeUrl(input: string): string {
  const value = input.trim();
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('請輸入有效的 HTTP 或 HTTPS 網址（不可含帳號密碼）。');
  return url.href;
}
