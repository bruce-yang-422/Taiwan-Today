export function initializeGoogleApps() {
  const container = document.querySelector<HTMLElement>('.google-apps')!;
  const toggle = document.getElementById('google-apps-toggle') as HTMLButtonElement;
  const panel = document.getElementById('google-apps-panel')!;
  const shortcuts = document.createElement('nav');
  shortcuts.className = 'google-quick-links';
  shortcuts.setAttribute('aria-label', 'Google 快速捷徑');
  panel.querySelectorAll<HTMLAnchorElement>('.google-apps-grid a').forEach(link => {
    const shortcut = link.cloneNode(true) as HTMLAnchorElement;
    shortcut.title = link.getAttribute('aria-label')!;
    shortcut.querySelector('span')?.remove();
    shortcuts.append(shortcut);
  });
  container.before(shortcuts);
  function setOpen(open: boolean) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', () => setOpen(panel.hidden !== false));
  document.addEventListener('pointerdown', event => {
    if (!container.contains(event.target as Node)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false); toggle.focus(); event.preventDefault();
    }
  });
  container.addEventListener('focusout', event => {
    if (!container.contains(event.relatedTarget as Node | null)) setOpen(false);
  });
  panel.addEventListener('click', event => {
    if ((event.target as Element).closest('a')) { setOpen(false); toggle.focus(); }
  });
}

