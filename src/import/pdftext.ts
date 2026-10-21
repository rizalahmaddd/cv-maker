import { loadPdfJs } from '../components/PdfPreview';

interface Item {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const FOOTER = /(Halaman|Page)\s+\d+\s+(dari|of)\s+\d+/i;

function toLines(items: Item[]): string[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Item[][] = [];
  for (const it of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0].y - it.y) < Math.max(2, it.h * 0.4)) last.push(it);
    else rows.push([it]);
  }
  // A wide horizontal gap means two side-by-side columns (e.g. languages in two columns), not one sentence.
  const lines: Item[][] = rows.flatMap((row) => {
    const parts: Item[][] = [];
    for (const it of row.sort((a, b) => a.x - b.x)) {
      const cur = parts[parts.length - 1];
      const prev = cur?.[cur.length - 1];
      if (cur && it.x - (prev!.x + prev!.w) < Math.max(28, it.h * 3)) cur.push(it);
      else parts.push([it]);
    }
    // A right-aligned date belongs to the title on its left, not to a second column.
    for (let i = parts.length - 1; i > 0; i--) {
      const text = parts[i].map((x) => x.str).join(' ');
      if (text.length < 32 && /(19|20)\d{2}|present|sekarang/i.test(text)) parts.splice(i - 1, 2, [...parts[i - 1], ...parts[i]]);
    }
    return parts;
  });
  return lines
    .map((l) =>
      l
        .sort((a, b) => a.x - b.x)
        .reduce((s, it, i, arr) => {
          if (!i) return it.str;
          const prev = arr[i - 1];
          const gap = it.x - (prev.x + prev.w);
          return s + (gap > it.h * 0.15 && !s.endsWith(' ') && !it.str.startsWith(' ') ? ' ' : '') + it.str;
        }, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((l) => l && !FOOTER.test(l));
}

export interface PdfText {
  lines: string[];
  linkedin: boolean;
}

// LinkedIn's "Save to PDF" puts contact and skills in a left sidebar; reading the main column first keeps the name
// and headline at the top, which is where the parser looks for them.
export async function extractPdfText(file: File): Promise<PdfText> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  try {
    const pages: { items: Item[]; width: number }[] = [];
    for (let i = 1; i <= Math.min(doc.numPages, 10); i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = content.items
        .filter((x): x is typeof x & { str: string; transform: number[]; width: number; height: number } => 'str' in x && !!(x as { str: string }).str.trim())
        .map((x) => ({ str: x.str, x: x.transform[4], y: x.transform[5], w: x.width, h: x.height || Math.abs(x.transform[3]) }));
      pages.push({ items, width: page.getViewport({ scale: 1 }).width });
    }
    const all = pages.flatMap((p) => p.items.map((i) => i.str)).join(' ');
    if (all.replace(/\s/g, '').length < 40) throw new Error('PDF ini tidak berisi teks (kemungkinan hasil scan atau foto). Ketik ulang atau tempel teksnya.');
    const linkedin = /linkedin\.com\/in\//i.test(all) && /(Top Skills|Keahlian Teratas|Contact|Kontak)/.test(all);
    if (!linkedin) return { lines: pages.flatMap((p) => toLines(p.items)), linkedin };
    const main: string[] = [];
    const side: string[] = [];
    for (const p of pages) {
      const cut = p.width * 0.33;
      side.push(...toLines(p.items.filter((i) => i.x < cut)));
      main.push(...toLines(p.items.filter((i) => i.x >= cut)));
    }
    return { lines: [...main, ...side], linkedin };
  } finally {
    doc.destroy();
  }
}
