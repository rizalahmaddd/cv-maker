import type { Cv, Entry, PersonalFlag, Section, SectionType, TemplateConfig } from '../types';
import { docLabels, type DocLabels } from './labels';
import { formatDay, formatRange, formatYM } from './dates';
import { displayUrl, LINK_NAMES, linkHref } from './contact';
import { pdfSafe } from './text';
import { SECTION_DEFS, sectionTitle } from '../presets/sections';
import { entryHasContent, sectionHasContent } from './content';
import { DEGREES, formatScore, GENDERS, MARITAL, optionLabel, RELIGIONS } from '../presets/personal';

export interface Contact {
  kind: 'email' | 'phone' | 'location' | 'link';
  text: string;
  href?: string;
  label?: string;
}

export interface CvView {
  cv: Cv;
  L: DocLabels;
  name: string;
  contacts: Contact[];
  personal: { key: PersonalFlag; label: string; value: string }[];
  sections: Section[];
  title: (s: Section) => string;
  range: (e: Entry, type: SectionType) => string;
}

function cleanDeep<T>(v: T): T {
  if (typeof v === 'string') return pdfSafe(v) as T;
  if (Array.isArray(v)) return v.map(cleanDeep) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanDeep(x)])) as T;
  return v;
}

export function fullName(cv: Cv): string {
  const p = cv.personal;
  const core = [p.prefix.trim(), p.fullName.trim()].filter(Boolean).join(' ');
  return p.suffix.trim() ? `${core}, ${p.suffix.trim()}` : core;
}

// Structured fields (degree, GPA, employment type) are stored as codes and turned into words in the CV's language here.
export function displayEntry(e: Entry, type: SectionType, lang: Cv['lang']): Entry {
  const opts = SECTION_DEFS[type].options;
  let out = opts?.extra && e.extra ? { ...e, extra: optionLabel(e.extra, opts.extra, lang) } : e;
  if (type === 'education') {
    const degree = e.degree ? optionLabel(e.degree, DEGREES, lang) : '';
    const subtitle = degree && e.subtitle.trim() ? (lang === 'en' ? `${degree}, ${e.subtitle.trim()}` : `${degree} ${e.subtitle.trim()}`) : degree || e.subtitle;
    const extra = [formatScore(e.score ?? '', e.scoreMax ?? '4', e.degree, lang), e.extra.trim()].filter(Boolean).join(' · ');
    out = { ...out, subtitle, extra };
  }
  return out;
}

// What a CV shows once options, hidden entries and empty sections are applied; shared by every export format.
export function buildView(rawCv: Cv, labels?: TemplateConfig['labels'], upper = false): CvView {
  const cv = cleanDeep(rawCv);
  const p = cv.personal;
  const L = docLabels(cv.lang);
  const flags = cv.options.personal;

  const location = [p.city, p.region, cv.country === 'ID' ? '' : p.country]
    .map((x) => x.trim())
    .filter(Boolean)
    .join(', ');
  const contacts: Contact[] = [];
  if (p.email.trim()) contacts.push({ kind: 'email', text: p.email.trim(), href: `mailto:${p.email.trim()}` });
  if (p.phone.trim()) contacts.push({ kind: 'phone', text: p.phone.trim(), href: `tel:${p.phone.replace(/[^\d+]/g, '')}` });
  if (location) contacts.push({ kind: 'location', text: location });
  for (const l of p.links) if (l.url.trim()) contacts.push({ kind: 'link', text: l.label.trim() || displayUrl(l.url), href: linkHref(l), label: LINK_NAMES[l.kind] });

  const personal: CvView['personal'] = [];
  const add = (key: PersonalFlag, label: string, value: string) => {
    if (flags[key] && value.trim()) personal.push({ key, label, value: value.trim() });
  };
  add('birth', L.birth, [p.birthPlace.trim(), p.birthDate ? formatDay(p.birthDate, cv.lang) : ''].filter(Boolean).join(', '));
  add('gender', L.gender, optionLabel(p.gender, GENDERS, cv.lang));
  add('religion', L.religion, optionLabel(p.religion, RELIGIONS, cv.lang));
  add('marital', L.marital, optionLabel(p.maritalStatus, MARITAL, cv.lang));
  add('nationality', L.nationality, p.nationality);
  add('body', L.body, [p.height && `${p.height} ${L.height}`, p.weight && `${p.weight} ${L.weight}`].filter(Boolean).join(' / '));
  add('license', L.license, p.drivingLicense);
  add('address', L.address, p.address);

  const sections = cv.sections.filter(sectionHasContent).map((s) => ({ ...s, entries: s.entries.filter(entryHasContent).map((e) => displayEntry(e, s.type, cv.lang)) }));

  return {
    cv,
    L,
    name: fullName(cv),
    contacts,
    personal,
    sections,
    title: (s) => {
      const t = sectionTitle(s.type, cv.lang, s.title || labels?.[cv.lang][s.type]);
      return upper ? t.toUpperCase() : t;
    },
    range: (e, type) => (SECTION_DEFS[type].singleDate ? formatYM(e.range.end.y ? e.range.end : e.range.start, cv.lang, cv.options.dateFormat) : formatRange(e.range, cv.lang, cv.options.dateFormat)),
  };
}
