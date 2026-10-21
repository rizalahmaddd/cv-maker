import { AlignmentType, Document, ImageRun, LevelFormat, Packer, Paragraph, TabStopType, TextRun } from 'docx';
import type { Cv, Letter, TemplateConfig } from '../types';
import { buildView } from '../lib/view';
import { formatDay } from '../lib/dates';
import { letterBlocks } from '../lib/letter';
import { FONTS, normalizeTemplate } from '../templates';

const WORD_FONT = { sans: 'Calibri', serif: 'Cambria', mono: 'Consolas' } as const;

function bytes(url: string): Uint8Array {
  const bin = atob(url.slice(url.indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function renderLetterDocx(l: Letter, cv: Cv, rawTpl: TemplateConfig, signature?: string): Promise<Blob> {
  const tpl = normalizeTemplate(rawTpl);
  const v = buildView({ ...cv, lang: l.lang });
  const font = WORD_FONT[FONTS.find((f) => f.key === tpl.fonts.body)?.kind ?? 'sans'];
  const primary = tpl.colors.primary.replace('#', '');
  const size = 22;
  const t = (text: string, o: Partial<{ bold: boolean; color: string; size: number }> = {}) => new TextRun({ text, font, size, ...o });
  const p = (children: TextRun[], o: Partial<{ after: number; justify: boolean }> = {}) =>
    new Paragraph({ spacing: { after: o.after ?? 0, line: 300 }, alignment: o.justify ? AlignmentType.JUSTIFIED : undefined, children });
  const id = l.lang === 'id';
  const dateLine = [l.place.trim(), l.date ? formatDay(l.date, l.lang) : ''].filter(Boolean).join(', ');
  const count = l.attachments.filter((a) => a.trim()).length;
  const recipient = [l.recipient, l.recipientTitle, l.company, l.companyAddress].map((x) => x.trim()).filter(Boolean);
  const children: Paragraph[] = [
    p([t(v.name || ' ', { bold: true, size: 36, color: primary })]),
    p([t(v.contacts.map((c) => c.text).join('  |  '), { size: 19 })], { after: 120 }),
    new Paragraph({ border: { bottom: { style: 'single', size: 8, color: primary, space: 1 } }, spacing: { after: 300 }, children: [] }),
  ];
  if (id) {
    children.push(
      new Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 9000 }], children: [t(`Perihal      : ${l.subject}`), t(`\t${dateLine}`)] }),
      ...(count ? [p([t(`Lampiran   : ${count} berkas`)])] : []),
      p([], { after: 200 }),
      p([t('Kepada Yth.')]),
    );
  } else children.push(p([t(dateLine)], { after: 200 }));
  recipient.forEach((r, i) => children.push(p([t(r, { bold: i === 0 || r === l.company.trim() })])));
  if (id) children.push(p([t('di tempat')]));
  children.push(p([], { after: 200 }));
  if (!id && l.subject.trim()) children.push(p([t(`Re: ${l.subject}`, { bold: true })], { after: 160 }));
  children.push(p([t(l.salutation)], { after: 160 }));
  for (const b of letterBlocks(l, cv)) {
    if (b.kind === 'p') children.push(p([t(b.text)], { after: 160, justify: true }));
    else b.items.forEach((it, i) => children.push(new Paragraph({ numbering: { reference: 'num', level: 0 }, spacing: { after: i === b.items.length - 1 ? 160 : 0 }, children: [t(it)] })));
  }
  children.push(p([t(l.closing)]));
  if (signature) {
    const data = bytes(signature);
    // PNG stores width and height as big-endian ints at bytes 16-23 of the IHDR chunk.
    const dv = new DataView(data.buffer);
    const ratio = dv.getUint32(16) / Math.max(1, dv.getUint32(20)) || 2;
    children.push(new Paragraph({ children: [new ImageRun({ type: 'png', data, transformation: { width: Math.round(60 * ratio), height: 60 } })] }));
  } else children.push(p([], { after: 800 }));
  children.push(p([t(v.name || ' ', { bold: true })]));
  const doc = new Document({
    creator: 'CV Maker',
    title: l.subject,
    numbering: {
      config: [{ reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 640, hanging: 300 } } } }] }],
    },
    styles: { default: { document: { run: { font, size } } }, paragraphStyles: [{ id: 'Normal', name: 'Normal', run: { font, size } }] },
    sections: [{ properties: { page: { margin: { top: 1100, bottom: 1100, left: 1200, right: 1200 } } }, children }],
  });
  return Packer.toBlob(doc);
}
