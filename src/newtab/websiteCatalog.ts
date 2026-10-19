import { t } from '../i18n';
import { catalogSites, websiteCategories, websiteKey, type CatalogSite } from '../shortcuts/websiteCatalog';
import type { Shortcut } from '../shortcuts/shortcuts';
import { websiteGridIcon } from './websiteIcon';
import { applyIconContrast } from '../shortcuts/iconContrast';

export function initializeWebsiteCatalog(getShortcuts: () => Shortcut[], save: (sites: CatalogSite[], removed: CatalogSite[]) => Promise<boolean>) {
  const dialog = document.getElementById('website-catalog-dialog') as HTMLDialogElement;
  const form = document.getElementById('website-catalog-form') as HTMLFormElement;
  const categories = document.getElementById('website-catalog-categories')!;
  const list = document.getElementById('website-catalog-list')!;
  const search = document.getElementById('website-catalog-search') as HTMLInputElement;
  const submit = document.getElementById('website-catalog-add') as HTMLButtonElement;
  const error = document.getElementById('website-catalog-error')!;
  const count = document.getElementById('website-catalog-count')!;
  const clear = document.getElementById('website-catalog-clear') as HTMLButtonElement;
  document.getElementById('website-catalog-symbol')!.append(websiteGridIcon());
  const selection = new Set<string>();
  const removal = new Set<string>();
  let category = 'all', busy = false;

  function existingKeys() { return new Set(getShortcuts().map(item => websiteKey(item.url))); }
  function updateCount() {
    const keys = existingKeys();
    for (const site of catalogSites) {
      if (keys.has(websiteKey(site.url))) selection.delete(site.id);
      else removal.delete(site.id);
    }
    count.textContent = removal.size ? t("新增 {0} 個・移除 {1} 個", [selection.size, removal.size]) : t("已選 {0} 個網站", [selection.size]);
    submit.textContent = removal.size ? t("儲存變更") : selection.size ? t("新增 {0} 個捷徑", [selection.size]) : t("儲存變更");
    submit.disabled = busy || (selection.size === 0 && removal.size === 0);
    clear.hidden = selection.size === 0 && removal.size === 0;
    clear.disabled = busy;
  }
  function render() {
    updateCount();
    const keys = existingKeys(), query = search.value.trim().toLocaleLowerCase();
    categories.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    list.replaceChildren();
    const sites = category === 'all' ? catalogSites : websiteCategories.find(item => item.id === category)!.sites;
    const matches = sites.filter(site => `${site.name} ${t(site.name)} ${site.url}`.toLocaleLowerCase().includes(query));
    document.getElementById('website-catalog-section')!.textContent = category === 'all' ? t("全部網站") : t(websiteCategories.find(item => item.id === category)!.name);
    document.getElementById('website-catalog-results')!.textContent = t("{0} 個網站", [matches.length]);
    for (const site of matches) {
      const added = keys.has(websiteKey(site.url));
      const label = document.createElement('label'); label.className = 'catalog-site';
      const input = document.createElement('input'); input.type = 'checkbox'; input.value = site.id;
      input.checked = (added && !removal.has(site.id)) || selection.has(site.id); input.disabled = busy;
      const badge = document.createElement('span'); badge.className = 'catalog-site-symbol'; badge.setAttribute('aria-hidden', 'true');
      badge.textContent = /^[A-Za-z]/.test(site.name) ? site.name.slice(0, 2).toUpperCase() : site.name.slice(0, 1);
      if (site.icon) {
        const image = document.createElement('img');
        image.alt = ''; image.width = 24; image.height = 24; image.src = `./${site.icon}`;
        applyIconContrast(image, badge);
        image.addEventListener('error', () => {
          badge.classList.remove('icon-light-artwork', 'icon-dark-artwork');
          badge.textContent = /^[A-Za-z]/.test(site.name) ? site.name.slice(0, 2).toUpperCase() : site.name.slice(0, 1);
        });
        badge.replaceChildren(image);
      }
      const text = document.createElement('span'); text.className = 'catalog-site-text';
      const name = document.createElement('strong'); name.textContent = t(site.name);
      const domain = document.createElement('small'); domain.textContent = new URL(site.url).hostname;
      text.append(name, domain); label.append(badge, text);
      const status = document.createElement('span'); status.className = 'catalog-added'; status.hidden = !added;
      const updateStatus = () => {
        const removing = removal.has(site.id);
        status.textContent = removing ? t("將移除") : t("已新增");
        label.classList.toggle('catalog-site-removing', removing);
        label.classList.toggle('catalog-site-existing', added && !removing);
      };
      updateStatus(); label.append(status);
      label.append(input);
      input.addEventListener('change', () => {
        if (added) {
          if (input.checked) removal.delete(site.id); else removal.add(site.id);
        } else {
          if (input.checked) selection.add(site.id); else selection.delete(site.id);
        }
        updateStatus();
        error.textContent = ''; updateCount();
      });
      list.append(label);
    }
    if (!list.children.length) { const empty = document.createElement('p'); empty.className = 'catalog-empty'; empty.textContent = t("找不到符合的網站，試試其他分類或關鍵字。"); list.append(empty); }
    updateCount();
  }
  for (const item of [{ id: 'all', name: t("全部") }, ...websiteCategories]) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = t(item.name);
    const total = document.createElement('span'); total.className = 'catalog-category-count'; total.setAttribute('aria-hidden', 'true');
    total.textContent = String(item.id === 'all' ? catalogSites.length : websiteCategories.find(category => category.id === item.id)!.sites.length);
    button.append(total);
    button.dataset.category = item.id; button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => { category = item.id; render(); list.scrollTop = 0; }); categories.append(button);
  }
  search.addEventListener('input', () => { render(); list.scrollTop = 0; });
  clear.addEventListener('click', () => { if (!busy) { selection.clear(); removal.clear(); render(); } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || (!selection.size && !removal.size)) return;
    busy = true; error.textContent = ''; render();
    dialog.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.disabled = true);
    search.disabled = true;
    try {
      const selected = catalogSites.filter(site => selection.has(site.id));
      const removed = catalogSites.filter(site => removal.has(site.id));
      if (await save(selected, removed)) { selection.clear(); removal.clear(); dialog.close(); }
      else error.textContent = t("捷徑無法儲存，請稍後重試。");
    } catch { error.textContent = t("捷徑無法儲存，請稍後重試。"); }
    finally {
      busy = false; search.disabled = false;
      dialog.querySelectorAll<HTMLButtonElement>('button').forEach(button => button.disabled = false);
      render();
    }
  });
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault(); event.stopPropagation();
    if (!busy) dialog.close();
  });
  return {
    open() {
      if (busy) return;
      selection.clear(); removal.clear(); category = 'all'; search.value = ''; error.textContent = '';
      render(); dialog.showModal(); search.focus({ preventScroll: true }); list.scrollTop = 0;
    },
    refresh() { if (dialog.open && !busy) render(); },
  };
}
