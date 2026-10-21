export async function imageToDataURL(file: File, maxSize = 800): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
      el.src = url;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    // PNG keeps transparency for logos, signatures and stamps; react-pdf only reads PNG and JPEG.
    return file.type === 'image/jpeg' ? canvas.toDataURL('image/jpeg', 0.9) : canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadFile(file: File | Blob, name?: string) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name ?? (file instanceof File ? file.name : 'download');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export async function shareOrDownload(file: File, text?: string): Promise<ShareResult> {
  const data: ShareData = { files: [file], title: file.name, text };
  if (navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  downloadFile(file);
  return 'downloaded';
}

export function safeFileName(s: string): string {
  return s
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Signatures are usually photographed on white paper; near-white pixels become transparent so only the ink prints.
export async function removeWhiteBackground(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Gambar tidak bisa dibaca.'));
    el.src = dataUrl;
  });
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    const lum = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
    if (lum > 215) d.data[i + 3] = 0;
    else if (lum > 160) d.data[i + 3] = Math.round(((215 - lum) / 55) * d.data[i + 3]);
  }
  g.putImageData(d, 0, 0);
  return c.toDataURL('image/png');
}
