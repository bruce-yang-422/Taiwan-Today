const controls = document.querySelectorAll('[data-screenshot-theme]');
controls.forEach(button => button.addEventListener('click', () => {
  const theme = button.dataset.screenshotTheme;
  if (!['light', 'dark'].includes(theme)) return;
  controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  document.querySelectorAll('[data-screenshot]').forEach(img => {
    img.src = `./docs/site/images/${img.dataset.screenshot}-${theme}.jpg`;
    img.alt = `${img.dataset.styleName}${theme === 'light' ? '亮色' : '暗色'}實際畫面`;
  });
  document.querySelectorAll('[data-screenshot-link]').forEach(link => {
    link.href = `./docs/site/images/${link.dataset.screenshotLink}-${theme}.jpg`;
  });
}));
