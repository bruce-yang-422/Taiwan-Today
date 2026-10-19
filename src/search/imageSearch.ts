import { t } from '../i18n';
import { searchUrl } from './search';

const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']);

export function initializeSearch(reportError: (message: string) => void) {
  const search = document.getElementById('search-form') as HTMLFormElement;
  const query = document.getElementById('search-input') as HTMLInputElement;
  const dialog = document.getElementById('image-search-dialog') as HTMLDialogElement;
  const form = document.getElementById('image-search-form') as HTMLFormElement;
  const input = document.getElementById('image-search-file') as HTMLInputElement;
  const preview = document.getElementById('image-search-preview') as HTMLImageElement;
  let currentUrl: string | undefined;
  let revision = 0;

  search.addEventListener('submit', event => {
    event.preventDefault();
    if (query.value.trim()) location.assign(searchUrl(query.value));
  });
  search.addEventListener('paste', event => {
    const file = Array.from(event.clipboardData?.items || [])
      .find(item => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile();
    if (!file) return;
    event.preventDefault();
    if (!imageTypes.has(file.type)) { reportError(t("圖片搜尋支援 PNG、JPEG、WebP、GIF 或 BMP。")); return; }
    if (file.size > 20 * 1024 * 1024) { reportError(t("圖片不可超過 20 MB。")); return; }
    const attempt = ++revision;
    const url = URL.createObjectURL(file);
    const image = new Image(); image.src = url;
    void image.decode().then(() => {
      if (attempt !== revision) { URL.revokeObjectURL(url); return; }
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = url; preview.src = url;
      const files = new DataTransfer();
      files.items.add(new File([file], file.name || 'clipboard.png', { type:file.type }));
      input.files = files.files;
      if (!dialog.open) dialog.showModal();
      (document.getElementById('image-search-submit') as HTMLButtonElement).focus();
    }).catch(() => {
      URL.revokeObjectURL(url);
      if (attempt === revision) reportError(t("無法讀取這張圖片，請重新複製後貼上。"));
    });
  });
  form.addEventListener('submit', () => {
    // Allow the browser to serialize the multipart form before clearing it.
    setTimeout(() => dialog.close(), 0);
  });
  dialog.addEventListener('close', () => {
    revision++;
    form.reset(); preview.removeAttribute('src');
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = undefined;
    query.focus({ preventScroll:true });
  });
}
