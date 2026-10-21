import type { Cv, Lang, Letter } from '../types';
import { db, getSettings, normalizeCv } from '../db';
import { uid, todayISO } from './id';
import { DEFAULT_ATTACHMENTS, LETTER_PRESETS } from '../presets/letters';
import { DEGREES, optionLabel } from '../presets/personal';
import { compareRangeDesc } from './dates';

export function letterTokens(cv: Cv | undefined, l: Pick<Letter, 'position' | 'company' | 'source' | 'lang'>): Record<string, string> {
  const lang = l.lang;
  const sec = (t: string) => cv?.sections.filter((s) => s.visible && s.type === t).flatMap((s) => s.entries.filter((e) => !e.hidden)) ?? [];
  const edu = [...sec('education')].sort((a, b) => compareRangeDesc(a.range, b.range))[0];
  const job = [...sec('experience')].sort((a, b) => compareRangeDesc(a.range, b.range))[0];
  const skills = sec('skills')
    .slice(0, 3)
    .map((e) => e.title.trim())
    .filter(Boolean);
  const degree = edu?.degree ? optionLabel(edu.degree, DEGREES, lang) : '';
  return {
    posisi: l.position.trim() || (lang === 'id' ? '[posisi]' : '[position]'),
    perusahaan: l.company.trim() || (lang === 'id' ? '[nama perusahaan]' : '[company]'),
    sumber: l.source.trim() || (lang === 'id' ? '[sumber informasi]' : '[source]'),
    pendidikan: [degree, edu?.subtitle.trim()].filter(Boolean).join(' ') || (lang === 'id' ? '[jurusan]' : '[degree]'),
    keahlian: skills.length ? skills.join(', ') : lang === 'id' ? '[keahlian utama]' : '[key skills]',
    jabatan: job ? [job.title.trim(), job.subtitle.trim()].filter(Boolean).join(lang === 'id' ? ' di ' : ' at ') : lang === 'id' ? '[jabatan saat ini]' : '[current role]',
    nama: cv?.personal.fullName.trim() ?? '',
  };
}

export function fillTokens(text: string, tokens: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => tokens[k] ?? m);
}

// The body keeps {posisi}-style codes and is filled at render time, so later edits to the fields still show up.
export function presetBody(key: string, lang: Lang): string {
  return (LETTER_PRESETS.find((x) => x.key === key) ?? LETTER_PRESETS[0]).body[lang];
}

export function defaultSubject(lang: Lang, position: string): string {
  if (lang === 'en') return position ? `Application for ${position}` : 'Job Application';
  return position ? `Lamaran Pekerjaan sebagai ${position}` : 'Lamaran Pekerjaan';
}

export async function createLetter(cvId?: string): Promise<Letter> {
  const s = await getSettings();
  const raw = cvId ? await db.cvs.get(cvId) : undefined;
  const cv = raw ? normalizeCv(raw) : undefined;
  const lang = cv?.lang ?? s.defaults.lang;
  const now = Date.now();
  const base = { position: cv?.targetRole ?? '', company: cv?.targetCompany ?? '', source: '', lang };
  const presetKey = cv?.sections.some((x) => x.type === 'experience' && x.entries.length) ? 'experienced' : 'fresh';
  const letter: Letter = {
    id: uid(),
    cvId: cv?.id,
    title: '',
    templateId: cv?.templateId ?? 'klasik',
    place: cv?.personal.city ?? '',
    date: todayISO(),
    subject: defaultSubject(lang, base.position),
    ...base,
    recipient: lang === 'id' ? 'Bapak/Ibu Pimpinan HRD' : 'Hiring Manager',
    recipientTitle: '',
    companyAddress: '',
    salutation: lang === 'id' ? 'Dengan hormat,' : 'Dear Hiring Manager,',
    body: presetBody(presetKey, lang),
    closing: lang === 'id' ? 'Hormat saya,' : 'Sincerely,',
    attachments: [...DEFAULT_ATTACHMENTS[lang]],
    createdAt: now,
    updatedAt: now,
  };
  await db.letters.add(letter);
  return letter;
}

export function normalizeLetter(l: Letter): Letter {
  return { ...l, position: l.position ?? '', source: l.source ?? '', attachments: l.attachments ?? [], recipientTitle: l.recipientTitle ?? '', companyAddress: l.companyAddress ?? '' };
}

// "[lampiran]" in the body marks where the numbered attachment list goes; without it the list follows the body.
export function letterBlocks(l: Letter, cv: Cv | undefined): ({ kind: 'p'; text: string } | { kind: 'list'; items: string[] })[] {
  const body = fillTokens(l.body, letterTokens(cv, l));
  const items = l.attachments.map((a) => a.trim()).filter(Boolean);
  const out: ({ kind: 'p'; text: string } | { kind: 'list'; items: string[] })[] = [];
  let placed = false;
  for (const para of body.split(/\n\s*\n/)) {
    const lines = para.split('\n');
    const at = lines.findIndex((x) => x.trim() === '[lampiran]');
    if (at < 0) {
      if (para.trim()) out.push({ kind: 'p', text: para.trim().replace(/\n/g, ' ') });
      continue;
    }
    const before = lines.slice(0, at).join(' ').trim();
    const after = lines
      .slice(at + 1)
      .join(' ')
      .trim();
    if (before) out.push({ kind: 'p', text: before });
    if (items.length) out.push({ kind: 'list', items });
    if (after) out.push({ kind: 'p', text: after });
    placed = true;
  }
  if (!placed && items.length) out.push({ kind: 'list', items });
  return out;
}

export function letterToText(l: Letter, cv: Cv | undefined, name: string): string {
  const blocks = letterBlocks(l, cv)
    .map((b) => (b.kind === 'p' ? b.text : b.items.map((x, i) => `${i + 1}. ${x}`).join('\n')))
    .join('\n\n');
  return [l.salutation, '', blocks, '', l.closing, name].join('\n').trim() + '\n';
}
