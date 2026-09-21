export function searchUrl(query: string) { return `https://www.google.com/search?${new URLSearchParams({ q: query.trim() })}`; }
export function normalizeUrl(input: string): string {
  const value = input.trim();
  const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('請輸入有效的 HTTP 或 HTTPS 網址（不可含帳號密碼）。');
  return url.href;
}
