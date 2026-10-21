import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  type ParagraphChild,
} from 'docx';
import type { Cv, Entry, Section, TemplateConfig } from '../types';
import { buildView, type CvView } from '../lib/view';
import { parseDetails } from '../lib/text';
import { LANGUAGE_LEVELS, SECTION_DEFS } from '../presets/sections';
import { FONTS, layoutMeta, normalizeTemplate } from '../templates';

// Word users rarely have the web fonts installed, so each family maps to a font every Office/WPS install ships.
const WORD_FONT = { sans: 'Calibri', serif: 'Cambria', mono: 'Consolas' } as const;

// Sizes in twentieths of a point (twips): A4, Letter, Legal and Indonesian F4/Folio.
const PAGE = { A4: [11906, 16838], LETTER: [12240, 15840], LEGAL: [12240, 20160], F4: [12189, 18709] } as const;
const MARGIN = { narrow: 680, normal: 900, wide: 1200 };

const TABLE_LAYOUTS = new Set(['formal', 'drh']);
const hex = (c: string) => c.replace('#', '').toUpperCase();
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

function dataUrlBytes(url: string): Uint8Array {
  const b64 = url.slice(url.indexOf(',') + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

interface Ctx {
  v: CvView;
  tpl: TemplateConfig;
  font: string;
  headFont: string;
  size: number;
  contentWidth: number;
}

function tr(ctx: Ctx, o: ConstructorParameters<typeof TextRun>[0] & object): TextRun {
  return new TextRun({ font: ctx.font, size: ctx.size, ...o });
}

// Shaded paragraphs with white text vanish in viewers that skip shading (Quick Look, some WPS builds),
// so every heading style becomes coloured text with a rule underneath.
function heading(ctx: Ctx, text: string): Paragraph {
  const color = hex(ctx.tpl.colors.primary);
  return new Paragraph({
    keepNext: true,
    spacing: { before: 220, after: 80 },
    border: ctx.tpl.style.heading === 'plain' ? undefined : { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    children: [tr(ctx, { text, bold: true, font: ctx.headFont, size: ctx.size + 3, color, characterSpacing: ctx.tpl.style.headingCase === 'upper' ? 10 : 0 })],
  });
}

function bullets(ctx: Ctx, text: string, keepFirst: boolean): Paragraph[] {
  const d = parseDetails(text);
  return [
    ...d.paragraphs.map((p) => new Paragraph({ spacing: { after: 40 }, children: [tr(ctx, { text: p, size: ctx.size })] })),
    ...d.bullets.map(
      (b, i) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, keepNext: keepFirst && i === 0, spacing: { after: 20 }, children: [tr(ctx, { text: b, size: ctx.size })] }),
    ),
  ];
}

function entry(ctx: Ctx, e: Entry, s: Section): Paragraph[] {
  const def = SECTION_DEFS[s.type];
  const date = def.fields.range ? ctx.v.range(e, s.type) : '';
  const title = e.title.trim() || e.subtitle.trim();
  const sub = e.title.trim()
    ? [def.fields.subtitle ? e.subtitle : '', def.fields.location ? e.location : '']
        .map((x) => x.trim())
        .filter(Boolean)
        .join(' · ')
    : e.location.trim();
  const out: Paragraph[] = [
    new Paragraph({
      keepNext: true,
      spacing: { before: 100 },
      tabStops: [{ type: TabStopType.RIGHT, position: ctx.contentWidth }],
      children: [tr(ctx, { text: title, bold: true, size: ctx.size + 1, font: ctx.headFont }), ...(date ? [tr(ctx, { text: `\t${date}`, size: ctx.size - 1, color: hex(ctx.tpl.colors.muted) })] : [])],
    }),
  ];
  if (sub) out.push(new Paragraph({ keepNext: true, children: [tr(ctx, { text: sub, size: ctx.size, color: hex(ctx.tpl.colors.accent), bold: true })] }));
  if (def.fields.extra && e.extra.trim())
    out.push(new Paragraph({ keepNext: !!e.details.trim(), children: [tr(ctx, { text: e.extra.trim(), size: ctx.size - 1, color: hex(ctx.tpl.colors.muted) })] }));
  if (def.fields.link && e.link.trim()) {
    const href = /^https?:/i.test(e.link) ? e.link : `https://${e.link}`;
    out.push(new Paragraph({ children: [new ExternalHyperlink({ link: href, children: [tr(ctx, { text: e.link.replace(/^https?:\/\//, ''), style: 'Hyperlink', size: ctx.size - 1 })] })] }));
  }
  if (def.fields.details) out.push(...bullets(ctx, e.details, false));
  return out;
}

function sectionBody(ctx: Ctx, s: Section): Paragraph[] {
  const def = SECTION_DEFS[s.type];
  const p = (children: ParagraphChild[]) => new Paragraph({ spacing: { after: 40 }, children });
  if (def.kind === 'text') return bullets(ctx, s.text, false);
  if (s.type === 'skills') {
    const groups = new Map<string, string[]>();
    for (const e of s.entries) groups.set(e.subtitle.trim(), [...(groups.get(e.subtitle.trim()) ?? []), e.title.trim()]);
    return [...groups].map(([g, list]) => p([...(g ? [tr(ctx, { text: `${g}: `, bold: true, size: ctx.size })] : []), tr(ctx, { text: list.join(', '), size: ctx.size })]));
  }
  if (s.type === 'languages') {
    return s.entries.map((e) => {
      const level = e.subtitle.trim() || (e.level ? LANGUAGE_LEVELS[ctx.v.cv.lang][e.level] : '');
      return p([
        tr(ctx, { text: e.title.trim(), bold: true, size: ctx.size }),
        tr(ctx, {
          text: [level, e.extra.trim()]
            .filter(Boolean)
            .map((x) => ` · ${x}`)
            .join(''),
          size: ctx.size,
        }),
      ]);
    });
  }
  if (s.type === 'hobbies') return [p([tr(ctx, { text: s.entries.map((e) => e.title.trim()).join(', '), size: ctx.size })])];
  return s.entries.flatMap((e) => entry(ctx, e, s));
}

function contactRuns(ctx: Ctx): ParagraphChild[] {
  const runs: ParagraphChild[] = [];
  ctx.v.contacts.forEach((c, i) => {
    if (i) runs.push(tr(ctx, { text: '  |  ', size: ctx.size - 1, color: hex(ctx.tpl.colors.muted) }));
    const run = tr(ctx, { text: c.text, size: ctx.size - 1, style: c.kind === 'link' ? 'Hyperlink' : undefined });
    runs.push(c.href && c.kind !== 'phone' ? new ExternalHyperlink({ link: c.href, children: [run] }) : run);
  });
  return runs;
}

function header(ctx: Ctx, photo?: string): (Paragraph | Table)[] {
  const { v, tpl } = ctx;
  const center = tpl.style.headerAlign === 'center' && !photo;
  const align = center ? AlignmentType.CENTER : AlignmentType.LEFT;
  const lines: Paragraph[] = [new Paragraph({ alignment: align, children: [tr(ctx, { text: v.name || ' ', bold: true, size: 44, font: ctx.headFont, color: hex(tpl.colors.primary) })] })];
  if (v.cv.personal.headline.trim())
    lines.push(
      new Paragraph({ alignment: align, spacing: { after: 60 }, children: [tr(ctx, { text: v.cv.personal.headline.trim(), size: ctx.size + 4, color: hex(tpl.colors.accent), bold: true })] }),
    );
  if (v.contacts.length && !TABLE_LAYOUTS.has(tpl.layout)) lines.push(new Paragraph({ alignment: align, spacing: { after: 40 }, children: contactRuns(ctx) }));
  if (v.personal.length && !TABLE_LAYOUTS.has(tpl.layout)) {
    lines.push(new Paragraph({ alignment: align, children: [tr(ctx, { text: v.personal.map((r) => `${r.label}: ${r.value}`).join('   ·   '), size: ctx.size - 1, color: hex(tpl.colors.muted) })] }));
  }
  const out: (Paragraph | Table)[] = [];
  if (!photo) out.push(...lines);
  else {
    const w = 1500;
    out.push(
      new Table({
        width: { size: ctx.contentWidth, type: WidthType.DXA },
        columnWidths: [ctx.contentWidth - w, w],
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders: NO_BORDERS, width: { size: ctx.contentWidth - w, type: WidthType.DXA }, children: lines }),
              new TableCell({
                borders: NO_BORDERS,
                width: { size: w, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new ImageRun({ type: 'jpg', data: dataUrlBytes(photo), transformation: { width: 90, height: 120 } })] })],
              }),
            ],
          }),
        ],
      }),
    );
  }
  if (TABLE_LAYOUTS.has(tpl.layout) && v.personal.length + v.contacts.length > 0) {
    const rows = [...v.personal.map((r) => [r.label, r.value]), ...v.contacts.filter((c) => c.kind !== 'location').map((c) => [c.label ?? (c.kind === 'email' ? v.L.email : v.L.phone), c.text])];
    const labelW = 2400;
    out.push(heading(ctx, tpl.style.headingCase === 'upper' ? v.L.personalData.toUpperCase() : v.L.personalData));
    out.push(
      new Table({
        width: { size: ctx.contentWidth, type: WidthType.DXA },
        columnWidths: [labelW, ctx.contentWidth - labelW],
        borders: NO_BORDERS,
        rows: rows.map(
          ([k, val]) =>
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  borders: NO_BORDERS,
                  width: { size: labelW, type: WidthType.DXA },
                  children: [new Paragraph({ children: [tr(ctx, { text: k, size: ctx.size, color: hex(tpl.colors.muted) })] })],
                }),
                new TableCell({
                  borders: NO_BORDERS,
                  width: { size: ctx.contentWidth - labelW, type: WidthType.DXA },
                  children: [new Paragraph({ children: [tr(ctx, { text: `: ${val}`, size: ctx.size })] })],
                }),
              ],
            }),
        ),
      }),
    );
  }
  return out;
}

// Word gets a single-column, real-heading document whatever the PDF design is: it stays editable and ATS-readable.
export async function renderCvDocx(cv: Cv, rawTpl: TemplateConfig, photo?: string): Promise<Blob> {
  const tpl = normalizeTemplate(rawTpl);
  const v = buildView(cv, tpl.labels, tpl.style.headingCase === 'upper');
  const kind = (k: string) => FONTS.find((f) => f.key === k)?.kind ?? 'sans';
  const [pw, ph] = PAGE[tpl.paper];
  const margin = MARGIN[tpl.style.margin];
  const size = Math.round(21 * Math.min(Math.max(tpl.style.fontScale, 0.85), 1.2));
  const ctx: Ctx = { v, tpl, font: WORD_FONT[kind(tpl.fonts.body)], headFont: WORD_FONT[kind(tpl.fonts.heading)], size, contentWidth: pw - margin * 2 };
  const usePhoto = cv.options.showPhoto && layoutMeta(tpl.layout).photo && photo?.startsWith('data:image/jpeg') ? photo : undefined;

  const doc = new Document({
    creator: 'CV Maker',
    title: v.name ? `CV ${v.name}` : 'CV',
    description: cv.targetRole || undefined,
    styles: {
      default: { document: { run: { font: ctx.font, size, color: hex(tpl.colors.text) }, paragraph: { spacing: { line: 264 } } } },
      paragraphStyles: [{ id: 'Normal', name: 'Normal', run: { font: ctx.font, size, color: hex(tpl.colors.text) } }],
      characterStyles: [{ id: 'Hyperlink', name: 'Hyperlink', run: { color: hex(tpl.colors.accent) } }],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: pw, height: ph }, margin: { top: margin, bottom: margin, left: margin, right: margin } } },
        children: [...header(ctx, usePhoto), ...v.sections.flatMap((s) => [heading(ctx, v.title(s)), ...sectionBody(ctx, s)])],
      },
    ],
  });
  return Packer.toBlob(doc);
}
