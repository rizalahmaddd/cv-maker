import type { Cv, PaperKey, TemplateConfig } from '../types';
import { normalizeTemplate } from '../templates';
import { buildView, type CvView } from '../lib/view';
import { family } from './fonts';

export type { Contact } from '../lib/view';

export interface CvCtx extends CvView {
  tpl: TemplateConfig;
  photo?: string;
  qr?: string;
  fz: { xs: number; sm: number; base: number; md: number; lg: number; xl: number; name: number };
  sp: { section: number; entry: number; line: number; para: number };
  pad: number;
  size: 'A4' | 'LETTER' | 'LEGAL' | [number, number];
  width: number;
  head: string;
  body: string;
  c: TemplateConfig['colors'];
}

// F4 (215 x 330 mm) is the folio size most Indonesian offices print on; react-pdf has no name for it.
const F4: [number, number] = [609.45, 935.43];
const WIDTH: Record<PaperKey, number> = { A4: 595.28, LETTER: 612, LEGAL: 612, F4: 609.45 };

export function pageSize(paper: PaperKey) {
  return paper === 'F4' ? F4 : paper;
}

const MARGIN = { narrow: 28, normal: 40, wide: 54 };
const SPACING = {
  compact: { section: 10, entry: 6, line: 1.3, para: 2 },
  normal: { section: 15, entry: 9, line: 1.4, para: 3 },
  airy: { section: 20, entry: 12, line: 1.5, para: 4 },
};

export function buildCtx(rawCv: Cv, rawTpl: TemplateConfig, photo?: string, qr?: string): CvCtx {
  const tpl = normalizeTemplate(rawTpl);
  const view = buildView(rawCv, tpl.labels, tpl.style.headingCase === 'upper');
  const k = Math.min(Math.max(tpl.style.fontScale || 1, 0.8), 1.25);
  const scale = <T extends Record<string, number>>(o: T) => Object.fromEntries(Object.entries(o).map(([key, v]) => [key, Math.round(v * k * 10) / 10])) as T;
  const compact = tpl.style.density === 'compact';
  return {
    ...view,
    tpl,
    photo: view.cv.options.showPhoto ? photo : undefined,
    qr: view.cv.options.showQr ? qr : undefined,
    fz: scale(compact ? { xs: 7, sm: 8, base: 9, md: 10, lg: 11.5, xl: 15, name: 22 } : { xs: 7.5, sm: 8.5, base: 9.5, md: 10.5, lg: 12, xl: 16, name: 25 }),
    sp: SPACING[tpl.style.density],
    pad: MARGIN[tpl.style.margin],
    size: pageSize(tpl.paper),
    width: WIDTH[tpl.paper],
    head: family(tpl.fonts.heading),
    body: family(tpl.fonts.body),
    c: tpl.colors,
  };
}

export function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((x) => x + x)
          .join('')
      : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (ch: number) => Math.round(ch * alpha + 255 * (1 - alpha));
  return `#${[mix(r), mix(g), mix(b)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

export function isDark(hex: string): boolean {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((x) => x + x)
          .join('')
      : h;
  const n = parseInt(full, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  // 0.19 is roughly where white and near-black text have equal contrast against the background.
  return 0.2126 * r + 0.7152 * g + 0.0722 * b <= 0.19;
}
