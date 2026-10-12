// Preserve the website's artwork; give transparent monochrome icons a readable backdrop.
export function applyIconContrast(image: HTMLImageElement, container: HTMLElement) {
  const update = () => {
    container.classList.remove('icon-light-artwork', 'icon-dark-artwork');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 32;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, 0, 0, 32, 32);
      const { data } = context.getImageData(0, 0, 32, 32);
      let visible = 0, transparent = 0, light = 0, dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 32) { transparent++; continue; }
        visible++;
        const luminance = (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255;
        if (luminance > 0.8) light++;
        if (luminance < 0.25) dark++;
      }
      // Opaque icons already include their own background.
      if (!visible || transparent < 32 * 32 * 0.1) return;
      if (light / visible > 0.85) container.classList.add('icon-light-artwork');
      else if (dark / visible > 0.85) container.classList.add('icon-dark-artwork');
    } catch { /* Unsupported images retain the normal theme background. */ }
  };
  image.addEventListener('load', update);
  if (image.complete && image.naturalWidth) update();
}
