import type { Cv, DateRange, Entry, LinkKind, Section, SectionType, YM } from '../types';
import { blankCv, emptyEntry, emptySection } from '../db';
import { normalizeUrl } from '../lib/contact';
import { parseDetails } from '../lib/text';
import { LANGUAGE_LEVELS } from '../presets/sections';
import { DEGREES, EMPLOYMENT, formatScore, optionLabel } from '../presets/personal';
import { uid } from '../lib/id';

// https://jsonresume.org/schema — the shared format other resume tools import.
type JR = Record<string, unknown> & {
  basics?: Record<string, unknown> & { location?: Record<string, string>; profiles?: { network?: string; url?: string; username?: string }[] };
};

const ym = (d: YM) => (d.y ? (d.m ? `${d.y}-${String(d.m).padStart(2, '0')}` : String(d.y)) : undefined);
const parseYM = (s: unknown): YM => {
  const m = typeof s === 'string' ? /^(\d{4})(?:-(\d{1,2}))?/.exec(s) : null;
  return m ? { y: Number(m[1]), m: m[2] ? Number(m[2]) : undefined } : {};
};
const dates = (r: DateRange) => ({ startDate: ym(r.start), endDate: r.current ? undefined : ym(r.end) });
const highlights = (e: Entry) => {
  const d = parseDetails(e.details);
  return { summary: d.paragraphs.join(' ') || undefined, highlights: d.bullets.length ? d.bullets : undefined };
};

const entries = (cv: Cv, ...types: SectionType[]) => cv.sections.filter((s) => s.visible && types.includes(s.type)).flatMap((s) => s.entries.filter((e) => !e.hidden));

export function toJsonResume(cv: Cv): object {
  const p = cv.personal;
  const name = [p.prefix, p.fullName].filter((x) => x.trim()).join(' ') + (p.suffix.trim() ? `, ${p.suffix.trim()}` : '');
  const summary = cv.sections.find((s) => s.type === 'summary' && s.visible)?.text;
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name,
      label: p.headline || undefined,
      email: p.email || undefined,
      phone: p.phone || undefined,
      summary: summary || undefined,
      location: { address: p.address || undefined, city: p.city || undefined, region: p.region || undefined, countryCode: p.country || undefined },
      profiles: p.links.filter((l) => l.url.trim()).map((l) => ({ network: l.kind, url: normalizeUrl(l.url, l.kind) })),
    },
    work: entries(cv, 'experience', 'internship').map((e) => ({
      name: e.subtitle,
      position: e.title,
      description: e.extra ? optionLabel(e.extra, EMPLOYMENT, 'en') : undefined,
      location: e.location || undefined,
      ...dates(e.range),
      ...highlights(e),
    })),
    volunteer: entries(cv, 'organization', 'committee', 'volunteer').map((e) => ({ organization: e.subtitle, position: e.title, ...dates(e.range), ...highlights(e) })),
    education: entries(cv, 'education').map((e) => ({
      institution: e.title,
      studyType: e.degree ? optionLabel(e.degree, DEGREES, 'en') : undefined,
      area: e.subtitle,
      score: formatScore(e.score ?? '', e.scoreMax ?? '4', e.degree, 'en') || e.extra || undefined,
      ...dates(e.range),
      courses: parseDetails(e.details).bullets,
    })),
    awards: entries(cv, 'awards').map((e) => ({ title: e.title, awarder: e.subtitle, date: ym(e.range.end.y ? e.range.end : e.range.start), summary: e.details || undefined })),
    certificates: entries(cv, 'certifications', 'training').map((e) => ({ name: e.title, issuer: e.subtitle, date: ym(e.range.end.y ? e.range.end : e.range.start), url: e.link || undefined })),
    publications: entries(cv, 'publications').map((e) => ({
      name: e.title,
      publisher: e.subtitle,
      releaseDate: ym(e.range.end.y ? e.range.end : e.range.start),
      url: e.link || undefined,
      summary: e.details || undefined,
    })),
    skills: entries(cv, 'skills').map((e) => ({ name: e.title, level: e.level ? String(e.level) : undefined, keywords: e.subtitle ? [e.subtitle] : undefined })),
    languages: entries(cv, 'languages').map((e) => ({ language: e.title, fluency: e.subtitle || LANGUAGE_LEVELS.en[e.level] || undefined })),
    interests: entries(cv, 'hobbies').map((e) => ({ name: e.title })),
    references: entries(cv, 'references').map((e) => ({ name: e.title, reference: [e.subtitle, e.extra].filter(Boolean).join(' · ') })),
    projects: entries(cv, 'projects').map((e) => ({ name: e.title, description: e.subtitle || undefined, url: e.link || undefined, ...dates(e.range), ...highlights(e) })),
    meta: { canonical: 'https://cv.solusikoding.com', version: 'v1.0.0', lastModified: new Date(cv.updatedAt).toISOString() },
    'x-cvmaker': cv,
  };
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
const KINDS: LinkKind[] = ['linkedin', 'github', 'instagram', 'behance', 'dribbble', 'youtube', 'tiktok'];

function details(o: Record<string, unknown>, ...keys: string[]): string {
  const lines: string[] = [];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) lines.push(v.trim());
    for (const x of arr(v)) if (typeof x === 'string') lines.push(x);
  }
  return lines.join('\n');
}

function range(o: Record<string, unknown>, start = 'startDate', end = 'endDate'): DateRange {
  return { start: parseYM(o[start]), end: parseYM(o[end]), current: !!o[start] && !o[end] };
}

function section(type: SectionType, list: Entry[]): Section | null {
  if (!list.length) return null;
  return { ...emptySection(type), entries: list };
}

export function fromJsonResume(data: unknown): Cv {
  const j = data as JR;
  if (!j || typeof j !== 'object') throw new Error('File JSON tidak valid.');
  const own = j['x-cvmaker'] as Cv | undefined;
  if (own && Array.isArray(own.sections)) return { ...own, id: uid() };
  if (!j.basics && !j.work && !j.education) throw new Error('File ini bukan JSON Resume.');
  const b = j.basics ?? {};
  const cv = blankCv('ID', 'id', 'klasik');
  cv.personal = {
    ...cv.personal,
    fullName: str(b.name),
    headline: str(b.label),
    email: str(b.email),
    phone: str(b.phone),
    city: str(b.location?.city),
    region: str(b.location?.region),
    address: str(b.location?.address),
    links: [
      ...(str(b.url) ? [{ id: uid(), kind: 'website' as LinkKind, url: str(b.url), label: '' }] : []),
      ...arr(b.profiles).map((p) => {
        const net = str(p.network).toLowerCase();
        return { id: uid(), kind: KINDS.find((k) => net.includes(k)) ?? ('other' as LinkKind), url: str(p.url) || str(p.username), label: '' };
      }),
    ],
  };
  const e = (patch: Partial<Entry>) => emptyEntry(patch);
  const all = [
    str(b.summary) ? { ...emptySection('summary'), text: str(b.summary) } : null,
    section(
      'experience',
      arr(j.work).map((w) => e({ title: str(w.position), subtitle: str(w.name) || str(w.company), location: str(w.location), range: range(w), details: details(w, 'summary', 'highlights') })),
    ),
    section(
      'education',
      arr(j.education).map((w) =>
        e({ title: str(w.institution), subtitle: [str(w.studyType), str(w.area)].filter(Boolean).join(', '), extra: str(w.score), range: range(w), details: details(w, 'courses') }),
      ),
    ),
    section(
      'organization',
      arr(j.volunteer).map((w) => e({ title: str(w.position), subtitle: str(w.organization), range: range(w), details: details(w, 'summary', 'highlights') })),
    ),
    section(
      'projects',
      arr(j.projects).map((w) => e({ title: str(w.name), subtitle: str(w.description), link: str(w.url), range: range(w), details: details(w, 'highlights') })),
    ),
    section(
      'skills',
      arr(j.skills).flatMap((w) =>
        arr(w.keywords).length && !w.level ? arr(w.keywords).map((k) => e({ title: String(k), subtitle: str(w.name) })) : [e({ title: str(w.name), level: Math.min(5, Number(w.level) || 0) })],
      ),
    ),
    section(
      'languages',
      arr(j.languages).map((w) => e({ title: str(w.language), subtitle: str(w.fluency) })),
    ),
    section(
      'certifications',
      arr(j.certificates).map((w) => e({ title: str(w.name), subtitle: str(w.issuer), link: str(w.url), range: { start: {}, end: parseYM(w.date), current: false } })),
    ),
    section(
      'awards',
      arr(j.awards).map((w) => e({ title: str(w.title), subtitle: str(w.awarder), details: str(w.summary), range: { start: {}, end: parseYM(w.date), current: false } })),
    ),
    section(
      'publications',
      arr(j.publications).map((w) =>
        e({ title: str(w.name), subtitle: str(w.publisher), link: str(w.url), details: str(w.summary), range: { start: {}, end: parseYM(w.releaseDate), current: false } }),
      ),
    ),
    section(
      'hobbies',
      arr(j.interests).map((w) => e({ title: str(w.name) })),
    ),
    section(
      'references',
      arr(j.references).map((w) => e({ title: str(w.name), subtitle: str(w.reference) })),
    ),
  ];
  cv.sections = all.filter((s): s is Section => !!s);
  cv.title = cv.personal.fullName ? `${cv.personal.fullName} (impor)` : 'CV impor';
  return cv;
}
