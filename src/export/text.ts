import type { Cv, Entry, Section, TemplateConfig } from '../types';
import { buildView, type CvView } from '../lib/view';
import { parseDetails } from '../lib/text';
import { LANGUAGE_LEVELS, SECTION_DEFS } from '../presets/sections';

interface Fmt {
  h1: (s: string) => string;
  h2: (s: string) => string;
  bold: (s: string) => string;
  bullet: string;
}

const PLAIN: Fmt = { h1: (s) => s.toUpperCase(), h2: (s) => `\n${s.toUpperCase()}\n${'-'.repeat(Math.min(s.length, 60))}`, bold: (s) => s, bullet: '- ' };
const MD: Fmt = { h1: (s) => `# ${s}`, h2: (s) => `\n## ${s}`, bold: (s) => `**${s}**`, bullet: '- ' };

function entryLines(v: CvView, e: Entry, s: Section, f: Fmt): string[] {
  const def = SECTION_DEFS[s.type];
  const date = def.fields.range ? v.range(e, s.type) : '';
  const head = [e.title.trim() ? f.bold(e.title.trim()) : '', e.subtitle.trim()].filter(Boolean).join(' — ');
  const meta = [def.fields.location ? e.location.trim() : '', date].filter(Boolean).join(' | ');
  const out = [[head, meta].filter(Boolean).join(f === MD ? '  \n' : '\n')];
  if (def.fields.extra && e.extra.trim()) out.push(e.extra.trim());
  if (def.fields.link && e.link.trim()) out.push(e.link.trim());
  if (def.fields.details) {
    const d = parseDetails(e.details);
    out.push(...d.paragraphs, ...d.bullets.map((b) => f.bullet + b));
  }
  return out;
}

function sectionLines(v: CvView, s: Section, f: Fmt): string[] {
  const def = SECTION_DEFS[s.type];
  if (def.kind === 'text') return [s.text.trim()];
  if (s.type === 'skills') {
    const groups = new Map<string, string[]>();
    for (const e of s.entries) groups.set(e.subtitle.trim(), [...(groups.get(e.subtitle.trim()) ?? []), e.title.trim()]);
    return [...groups].map(([g, list]) => (g ? `${f.bold(g)}: ${list.join(', ')}` : list.join(', ')));
  }
  if (s.type === 'languages') {
    return s.entries.map((e) => {
      const level = e.subtitle.trim() || (e.level ? LANGUAGE_LEVELS[v.cv.lang][e.level] : '');
      return f.bullet + [e.title.trim(), level, e.extra.trim()].filter(Boolean).join(' — ');
    });
  }
  if (s.type === 'hobbies') return [s.entries.map((e) => e.title.trim()).join(', ')];
  return s.entries.flatMap((e) => [...entryLines(v, e, s, f), '']);
}

function render(cv: Cv, f: Fmt, labels?: TemplateConfig['labels']): string {
  const v = buildView(cv, labels);
  const p = v.cv.personal;
  const out: string[] = [f.h1(v.name || 'CV')];
  if (p.headline.trim()) out.push(p.headline.trim());
  const contact = v.contacts.map((c) => (c.kind === 'link' ? (c.href ?? c.text) : c.text)).join(' | ');
  if (contact) out.push(contact);
  if (v.personal.length) out.push('', ...v.personal.map((r) => `${r.label}: ${r.value}`));
  for (const s of v.sections) out.push(f.h2(v.title(s)), ...sectionLines(v, s, f));
  return (
    out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

export function cvToText(cv: Cv, labels?: TemplateConfig['labels']): string {
  return render(cv, PLAIN, labels);
}

export function cvToMarkdown(cv: Cv, labels?: TemplateConfig['labels']): string {
  return render(cv, MD, labels);
}

export function sectionToText(cv: Cv, sectionId: string): string {
  const v = buildView(cv);
  const s = v.sections.find((x) => x.id === sectionId);
  return s ? sectionLines(v, s, PLAIN).join('\n').trim() : '';
}
