import { validIcon } from './shortcuts';

export async function importShortcutIcon(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error('圖示不得超過 5 MB。');
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const ico = bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0;
  if (!png && !ico) throw new Error('請選擇 PNG 或 ICO 圖示。');

  // Normalize MIME types: ICO files may arrive with an empty or generic type.
  const url = URL.createObjectURL(new Blob([file], { type: png ? 'image/png' : 'image/x-icon' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => { throw new Error('圖示無法讀取，請選擇有效的 PNG 或 ICO 檔案。'); });
    const scale = Math.min(1, 64 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('圖示處理失敗，請重試。');
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const icon = canvas.toDataURL('image/png');
    if (!validIcon(icon)) throw new Error('圖示處理失敗，請重試。');
    return icon;
  } finally {
    URL.revokeObjectURL(url);
  }
}
