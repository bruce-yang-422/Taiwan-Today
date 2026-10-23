import { localizeDocument, resolveLocale, setLocale, t, type Language } from '../i18n';
import { readStorage, writeStorage } from '../shortcuts/storage';

async function start() {
  let language: Language = 'auto';
  try {
    const stored = await readStorage('language');
    if (stored === 'zh-TW' || stored === 'en' || stored === 'ja') language = stored;
  } catch { /* Use the browser language if storage is unavailable. */ }
  setLocale(resolveLocale(language, navigator.languages));
  localizeDocument();
  const selector = document.getElementById('language') as HTMLSelectElement;
  selector.value = language;
  selector.addEventListener('change', async () => {
    selector.disabled = true;
    try {
      await writeStorage('language', selector.value);
      location.reload();
    } catch {
      selector.value = language;
      selector.disabled = false;
      const status = document.getElementById('status')!;
      status.hidden = false;
      status.textContent = t('設定無法儲存，請稍後重試。');
    }
  });
  await import('./newtab');
}

void start().catch(() => {
  const status = document.getElementById('status')!;
  status.hidden = false;
  status.textContent = t('頁面載入失敗，請重新整理。');
}).finally(() => document.documentElement.removeAttribute('data-loading'));
