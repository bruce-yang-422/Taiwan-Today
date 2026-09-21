export function initializeSettingsTabs() {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('.settings-tabs [role="tab"]')];
  const select = (tab: HTMLButtonElement) => {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')!)!.hidden = !active;
    }
    document.querySelector('.settings-panels')!.scrollTop = 0;
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      select(tabs[next]);
      tabs[next].focus();
    });
  });
}
