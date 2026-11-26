const controls = document.querySelectorAll('[data-screenshot-theme]');
controls.forEach(button => button.addEventListener('click', () => {
  const theme = button.dataset.screenshotTheme;
  if (!['light', 'dark'].includes(theme)) return;
  controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  document.querySelectorAll('[data-screenshot]').forEach(img => {
    img.src = `./docs/site/images/${img.dataset.screenshot}-${theme}.jpg`;
    const light = theme === 'light';
    const suffix = {
      en: light ? ' light-theme screenshot' : ' dark-theme screenshot',
      ja: light ? 'のライトテーマ画面' : 'のダークテーマ画面',
      'zh-Hans': light ? '亮色实际画面' : '暗色实际画面',
    };
    img.alt = img.dataset.styleName + (suffix[document.documentElement.lang] ?? (light ? '亮色實際畫面' : '暗色實際畫面'));
  });
  document.querySelectorAll('[data-screenshot-link]').forEach(link => {
    link.href = `./docs/site/images/${link.dataset.screenshotLink}-${theme}.jpg`;
  });
}));
