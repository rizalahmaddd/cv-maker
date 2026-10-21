import { loadPdfJs } from '../components/PdfPreview';

export type ImageFormat = 'png' | 'jpeg';

async function toBlob(canvas: HTMLCanvasElement, format: ImageFormat): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gambar gagal dibuat.'))), `image/${format}`, 0.92));
}

// 2.5x of the PDF's 72 dpi gives ~1490px wide A4 pages: sharp on phones and in WhatsApp without huge files.
export async function pdfToImages(pdf: Blob, format: ImageFormat, opts: { scale?: number; stacked?: boolean } = {}): Promise<Blob[]> {
  const scale = opts.scale ?? 2.5;
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) }).promise;
  try {
    const pages: HTMLCanvasElement[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(canvas);
    }
    if (!opts.stacked || pages.length === 1) return Promise.all(pages.map((c) => toBlob(c, format)));
    const gap = Math.round(12 * scale);
    const tall = document.createElement('canvas');
    tall.width = pages[0].width;
    tall.height = pages.reduce((h, c) => h + c.height, 0) + gap * (pages.length - 1);
    const t = tall.getContext('2d')!;
    t.fillStyle = '#e5e7eb';
    t.fillRect(0, 0, tall.width, tall.height);
    let y = 0;
    for (const c of pages) {
      t.drawImage(c, 0, y);
      y += c.height + gap;
    }
    return [await toBlob(tall, format)];
  } finally {
    doc.destroy();
  }
}

export async function pdfPageCount(pdf: Blob): Promise<number> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) }).promise;
  const n = doc.numPages;
  doc.destroy();
  return n;
}
