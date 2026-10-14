import database from '../../data/websites.json';
import { normalizeUrl } from '../search/search';
import type { Shortcut } from './shortcuts';

export interface CatalogSite { id: string; name: string; url: string; icon?: string; matchPaths?: string[] }
export const websiteCategories = database.categories;
export const catalogSites: CatalogSite[] = websiteCategories.flatMap(category => category.sites);

export function websiteKey(value: string): string {
  const url = new URL(normalizeUrl(value));
  const host = url.hostname.replace(/^www\./, '');
  const path = url.pathname.replace(/\/+$/, '');
  // Catalog landing pages may use account routes or tracking parameters.
  // Keep unrelated paths distinct (e.g. Google Search and Google Maps).
  const match = catalogSites.find(site => {
    const canonical = new URL(site.url);
    if (canonical.hostname.replace(/^www\./, '') !== host || canonical.port !== url.port) return false;
    const paths = [canonical.pathname, ...(site.matchPaths || [])];
    return paths.some(pattern => {
      const segments = pattern.replace(/\/+$/, '').split('/');
      const actual = path.split('/');
      return segments.length === actual.length && segments.every((segment, i) => segment === '*' ? Boolean(actual[i]) : segment === actual[i]);
    });
  });
  if (match) {
    const canonical = new URL(match.url);
    return host + (url.port ? `:${url.port}` : '') + canonical.pathname.replace(/\/+$/, '') + canonical.search;
  }
  url.searchParams.sort();
  return host + (url.port ? `:${url.port}` : '') + path + url.search;
}

export function addCatalogSites(existing: Shortcut[], selected: CatalogSite[]): Shortcut[] {
  const keys = new Set(existing.map(item => websiteKey(item.url)));
  const next = [...existing];
  for (const site of selected) {
    const key = websiteKey(site.url);
    if (keys.has(key)) continue;
    keys.add(key);
    next.push({ id: crypto.randomUUID(), name: site.name, url: normalizeUrl(site.url), order: next.length });
  }
  return next;
}

export function updateCatalogSites(existing: Shortcut[], selected: CatalogSite[], removed: CatalogSite[]): Shortcut[] {
  const removeKeys = new Set(removed.map(site => websiteKey(site.url)));
  return addCatalogSites(existing.filter(item => !removeKeys.has(websiteKey(item.url))), selected);
}
