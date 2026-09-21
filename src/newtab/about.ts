import application from '../../manifest.json';
import packageInfo from '../../package.json';
import bundledManifest from '../../data/update-manifest.json';
import { parseManifest, type DataCache, type DataManifest } from '../data/updates';

export function renderAbout(cache?: DataCache) {
  document.getElementById('about-author')!.textContent = packageInfo.author;
  document.getElementById('about-version')!.textContent = application.version;
  const manifest: DataManifest | undefined = cache ? cache.manifest : parseManifest(bundledManifest);
  const revision = cache?.revision ?? bundledManifest.revision;
  const label = manifest?.version ? `v${manifest.version}` : `舊版資料（${revision.slice(0, 8)}）`;
  document.getElementById('about-data-version')!.textContent = `${label} · ${cache ? 'GitHub 更新' : '隨插件附帶'}`;
  document.getElementById('about-data-updated')!.textContent = manifest?.updatedAt
    ? new Date(manifest.updatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) : '未提供';
  const list = document.getElementById('about-data-files')!;
  list.replaceChildren();
  const files = cache
    ? Object.keys(cache.files).sort().map(name => ({ name, version: cache.manifest?.files.find(file => file.name === name)?.version }))
    : manifest!.files;
  for (const file of files) {
    const row = document.createElement('div');
    const name = document.createElement('dt'); name.textContent = file.name;
    const version = document.createElement('dd'); version.textContent = file.version ? `v${file.version}` : '舊版未提供';
    row.append(name, version); list.append(row);
  }
  document.getElementById('about-data-files-note')!.hidden = files.every(file => Boolean(file.version));
  return label;
}
