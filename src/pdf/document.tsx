import { Buffer } from 'buffer';
import { Document, pdf } from '@react-pdf/renderer';
import type { Cv, LayoutKey, TemplateConfig } from '../types';
import { buildCtx, type CvCtx } from './context';
import { registerFonts } from './fonts';
import { normalizeUrl } from '../lib/contact';
import { Klasik } from './layouts/Klasik';
import { Garis } from './layouts/Garis';
import { Modern } from './layouts/Modern';
import { Formal } from './layouts/Formal';
import { Sidebar } from './layouts/Sidebar';
import { Kepala } from './layouts/Kepala';
import { Drh } from './layouts/Drh';
import { Timeline } from './layouts/Timeline';
import { Kreatif } from './layouts/Kreatif';
import { Europass } from './layouts/Europass';
import { Rirekisho } from './layouts/Rirekisho';

// react-pdf checks Buffer.isBuffer after loading images and logs a warning per image when it's missing.
(globalThis as { Buffer?: unknown }).Buffer ??= Buffer;

const LAYOUTS: Record<LayoutKey, ({ ctx }: { ctx: CvCtx }) => React.JSX.Element> = {
  klasik: Klasik,
  garis: Garis,
  modern: Modern,
  formal: Formal,
  sidebar: Sidebar,
  kepala: Kepala,
  drh: Drh,
  timeline: Timeline,
  kreatif: Kreatif,
  europass: Europass,
  rirekisho: Rirekisho,
};

export function CvDocument({ ctx }: { ctx: CvCtx }) {
  const Layout = LAYOUTS[ctx.tpl.layout] ?? Klasik;
  const skills = ctx.sections.find((s) => s.type === 'skills')?.entries.map((e) => e.title) ?? [];
  return (
    <Document
      title={ctx.name ? `CV ${ctx.name}` : 'CV'}
      author={ctx.name || undefined}
      subject={ctx.cv.targetRole || ctx.cv.personal.headline || undefined}
      keywords={skills.join(', ') || undefined}
      creator="CV Maker"
      producer="CV Maker"
      language={ctx.cv.lang}
    >
      <Layout ctx={ctx} />
    </Document>
  );
}

async function qrFor(cv: Cv): Promise<string | undefined> {
  if (!cv.options.showQr) return undefined;
  const url = cv.options.qrUrl.trim() || cv.personal.links.find((l) => l.url.trim())?.url;
  if (!url) return undefined;
  const { toDataURL } = await import('qrcode');
  return toDataURL(normalizeUrl(url), { margin: 0, width: 240, errorCorrectionLevel: 'M' });
}

// react-pdf leaves page dictionaries uncompressed, so counting them avoids parsing the whole file with PDF.js.
export async function countPages(blob: Blob): Promise<number> {
  const text = new TextDecoder('latin1').decode(await blob.arrayBuffer());
  return text.match(/\/Type\s*\/Page(?![s\w])/g)?.length ?? 1;
}

const FIT_STEPS: Partial<TemplateConfig['style']>[] = [{}, { fontScale: 0.95 }, { fontScale: 0.92, density: 'compact' }, { fontScale: 0.88, density: 'compact', margin: 'narrow' }];

export async function renderCvPdf(cv: Cv, tpl: TemplateConfig, photo?: string): Promise<Blob> {
  registerFonts();
  const qr = await qrFor(cv);
  const render = (t: TemplateConfig) => pdf(<CvDocument ctx={buildCtx(cv, t, photo, qr)} />).toBlob();
  if (!cv.options.fitOnePage) return render(tpl);
  let blob: Blob | null = null;
  for (const step of FIT_STEPS) {
    const scale = (tpl.style.fontScale || 1) * (step.fontScale ?? 1);
    blob = await render({ ...tpl, style: { ...tpl.style, ...step, fontScale: scale } });
    if ((await countPages(blob)) <= 1) break;
  }
  return blob!;
}
