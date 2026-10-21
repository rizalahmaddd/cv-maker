import type { CvLink, DateRange, Entry, Personal, Section, SectionType, YM } from '../types';
import { emptyEntry, emptySection } from '../db';
import { uid } from '../lib/id';
import { guessKind, normalizePhone } from '../lib/contact';
import { isBulletLine, normalizeText, splitList, stripBullet } from '../lib/text';
import { DEGREES } from '../presets/personal';

type HeadingKey = SectionType | 'contact';

const HEADINGS: [HeadingKey, string[]][] = [
  [
    'summary',
    ['ringkasan', 'profil', 'profil singkat', 'tentang saya', 'summary', 'profile', 'about', 'about me', 'objective', 'career objective', 'professional summary', 'ringkasan profil', 'deskripsi diri'],
  ],
  ['experience', ['pengalaman kerja', 'pengalaman', 'riwayat pekerjaan', 'pengalaman profesional', 'experience', 'work experience', 'employment history', 'professional experience', 'work history']],
  ['internship', ['magang', 'pengalaman magang', 'internship', 'internships', 'praktik kerja lapangan', 'pkl']],
  ['education', ['pendidikan', 'riwayat pendidikan', 'pendidikan formal', 'education', 'academic background', 'educational background']],
  ['organization', ['pengalaman organisasi', 'organisasi', 'riwayat organisasi', 'organizational experience', 'organizations', 'leadership', 'leadership experience']],
  ['committee', ['kepanitiaan', 'pengalaman kepanitiaan', 'committee', 'committee experience']],
  ['volunteer', ['relawan', 'kegiatan sosial', 'volunteer', 'volunteering', 'volunteer experience']],
  ['projects', ['proyek', 'portofolio', 'projects', 'portfolio']],
  ['skills', ['keahlian', 'kemampuan', 'keterampilan', 'skills', 'top skills', 'keahlian teratas', 'technical skills', 'hard skills', 'soft skills', 'skill', 'kompetensi']],
  ['languages', ['bahasa', 'kemampuan bahasa', 'languages', 'language']],
  ['certifications', ['sertifikasi', 'sertifikat', 'certifications', 'certificates', 'licenses & certifications', 'licenses and certifications', 'lisensi & sertifikasi']],
  ['training', ['pelatihan', 'kursus', 'seminar', 'training', 'courses', 'pelatihan dan kursus']],
  ['awards', ['prestasi', 'penghargaan', 'awards', 'honors-awards', 'honors & awards', 'honors and awards', 'achievements']],
  ['publications', ['publikasi', 'karya ilmiah', 'publications']],
  ['hobbies', ['hobi', 'minat', 'interests', 'hobbies', 'minat & hobi']],
  ['references', ['referensi', 'references', 'referees']],
  ['contact', ['kontak', 'contact', 'contact information', 'data diri', 'data pribadi', 'personal details', 'personal information', 'informasi pribadi', 'biodata']],
];

const HEADING_MAP = new Map<string, HeadingKey>(HEADINGS.flatMap(([k, list]) => list.map((w) => [w, k] as const)));

function headingOf(line: string): HeadingKey | null {
  const key = line
    .toLowerCase()
    .replace(/[:：]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return key.length <= 40 ? (HEADING_MAP.get(key) ?? null) : null;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  januari: 1,
  january: 1,
  feb: 2,
  februari: 2,
  february: 2,
  mar: 3,
  maret: 3,
  march: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  juni: 6,
  june: 6,
  jul: 7,
  juli: 7,
  july: 7,
  agu: 8,
  agt: 8,
  agustus: 8,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  des: 12,
  desember: 12,
  dec: 12,
  december: 12,
};

const MONTH_RE = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join('|');
const POINT = `(?:(?:${MONTH_RE})\\.?\\s+)?(?:(?:0?[1-9]|1[0-2])[/.-])?(?:19|20)\\d{2}`;
const NOW = '(?:present|sekarang|saat ini|now|current|kini|hingga kini|sampai sekarang)';
const RANGE_RE = new RegExp(`(${POINT})\\s*(?:[-–—]|s\\.?d\\.?|to|sampai|hingga)\\s*(${POINT}|${NOW})`, 'i');
const SINGLE_RE = new RegExp(`(?:^|\\s|\\()(${POINT})(?:\\)|\\s|$)`, 'i');

function parsePoint(s: string): YM {
  const year = /(19|20)\d{2}/.exec(s);
  const month = new RegExp(`(${MONTH_RE})`, 'i').exec(s);
  const num = /(?:^|\s)(0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}/.exec(s);
  return { y: year ? Number(year[0]) : undefined, m: month ? MONTHS[month[1].toLowerCase()] : num ? Number(num[1]) : undefined };
}

function findRange(line: string): { range: DateRange; rest: string } | null {
  const r = RANGE_RE.exec(line);
  if (r) {
    const current = new RegExp(NOW, 'i').test(r[2]);
    const rest = line
      .replace(r[0], ' ')
      .replace(/\(\s*\d+\s*(?:tahun|bulan|years?|months?|yrs?|mos?)[^)]*\)/gi, '')
      .replace(/\(\s*\)/g, '')
      .replace(/[·|,(-]+\s*$/g, '')
      .replace(/^\s*[·|,)-]+/g, '')
      .trim();
    return { range: { start: parsePoint(r[1]), end: current ? {} : parsePoint(r[2]), current }, rest };
  }
  return null;
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE = /(?:\+?62|0)8[\d\s().-]{7,16}\d|\+\d[\d\s().-]{8,16}\d/;
const URL = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|id|net|org|io|dev|me|co|ac\.id|co\.id)(?:\/[^\s)]*)?/i;

export interface ParsedCv {
  personal: Partial<Personal>;
  sections: Section[];
  unassigned: string[];
}

function splitTitle(header: string[], linkedin: boolean, type: SectionType): { title: string; subtitle: string } {
  if (header.length >= 2) {
    const [a, b] = header.slice(-2);
    // LinkedIn prints the company first and the role underneath; most CVs do the opposite.
    if (type === 'experience' && linkedin) return { title: b, subtitle: a };
    return { title: a, subtitle: b };
  }
  const one = header[0] ?? '';
  const parts = one.split(/\s+(?:[-–—|·]|at|di)\s+/i);
  return parts.length >= 2 ? { title: parts[0].trim(), subtitle: parts.slice(1).join(' ').trim() } : { title: one, subtitle: '' };
}

const LOCATION = /^[A-Z][\p{L} .'-]{1,30},\s*[A-Z][\p{L} .'-]{1,30}$/u;

function parseDated(lines: string[], type: SectionType, linkedin: boolean): Entry[] {
  const dates = lines.map(findRange);
  const idx = dates.map((d, i) => (d ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) return lines.length ? [emptyEntry({ title: lines[0], details: lines.slice(1).map(stripBullet).join('\n') })] : [];
  // Up to two short, non-bullet lines right above a date range are that entry's title and organisation.
  // When the title shares a line with the date and the organisation follows on the next line, nothing above belongs to it.
  const inline = idx.map((di) => {
    const nxt = lines[di + 1];
    return !linkedin && !!dates[di]!.rest && !!nxt && nxt.length < 90 && !isBulletLine(nxt) && !findRange(nxt);
  });
  const heads = idx.map((di, k) => {
    if (inline[k]) return di;
    const floor = k ? idx[k - 1] + 1 : 0;
    let hs = di;
    while (hs > floor && di - hs < 2 && !isBulletLine(lines[hs - 1]) && lines[hs - 1].length < 90) hs--;
    return hs;
  });
  return idx.map((di, k) => {
    const d = dates[di]!;
    let next = di + 1;
    const header = lines.slice(heads[k], di);
    if (d.rest) header.push(d.rest);
    if (inline[k]) {
      header.push(lines[next]);
      next++;
    }
    const split = splitTitle(header, linkedin, type);
    const [subtitle, place] = split.subtitle.split(/\s+·\s+/);
    const e = emptyEntry({ title: split.title, subtitle: subtitle ?? '', location: place ?? '', range: d.range });
    if (!e.location && lines[next] && LOCATION.test(lines[next]) && next < (heads[k + 1] ?? lines.length)) {
      e.location = lines[next];
      next++;
    }
    const until = k + 1 < idx.length ? heads[k + 1] : lines.length;
    e.details = lines.slice(next, until).map(stripBullet).filter(Boolean).join('\n');
    if (type === 'education') {
      const deg = /^(S1|S2|S3|D3|D4|SMA|SMK|SMP|SD|MA)\b/i.exec(e.subtitle);
      if (deg && DEGREES[deg[1].toUpperCase()]) {
        e.degree = deg[1].toUpperCase();
        e.subtitle = e.subtitle.slice(deg[0].length).replace(/^[\s,.-]+/, '');
      }
      const gpa = /(?:IPK|GPA)\s*:?\s*(\d(?:[.,]\d{1,2})?)\s*(?:\/\s*(\d)(?:[.,]0+)?)?/i.exec(e.details);
      if (gpa) {
        e.score = gpa[1].replace(',', '.');
        e.scoreMax = gpa[2] ?? '4';
        e.details = e.details.replace(gpa[0], '').trim();
      }
    }
    return e;
  });
}

function parseList(lines: string[], type: SectionType): Entry[] {
  const out: Entry[] = [];
  for (const l of lines) {
    const group = type === 'skills' ? /^([^:,]{2,30}):\s*(.+)$/.exec(l) : null;
    if (group) {
      out.push(...splitList(group[2]).map((title) => emptyEntry({ title, subtitle: group[1].trim() })));
      continue;
    }
    if (type === 'languages' && out.length && /^(TOEFL|IELTS|TOEIC|JLPT|TOPIK|HSK|DELF|Goethe|PTE|Duolingo)\b/i.test(l)) {
      out[out.length - 1].extra = l;
      continue;
    }
    const parts = l.split(/\s{3,}/);
    out.push(...parts.flatMap((part) => toItems(part, type)));
  }
  return out;
}

function toItems(l: string, type: SectionType): Entry[] {
  const items = (l.length < 80 && /[,;•|]/.test(l) && !/[()]/.test(l) ? splitList(l.replace(/[•|]/g, ',')) : [stripBullet(l)]).filter(Boolean);
  return items.map((t) => {
    if (type === 'languages') {
      const m = /^(.+?)\s*[(:–·-]\s*([^)]+)\)?$/.exec(t);
      if (m) return emptyEntry({ title: m[1].trim(), subtitle: m[2].trim() });
    }
    return emptyEntry({ title: t });
  });
}

function parseSingles(lines: string[]): Entry[] {
  const out: Entry[] = [];
  for (const l of lines) {
    const single = SINGLE_RE.exec(l);
    const range = findRange(l);
    if (!range && single && out.length && l.replace(single[1], '').trim().length < 4) {
      out[out.length - 1].range = { start: {}, end: parsePoint(single[1]), current: false };
      continue;
    }
    const title = stripBullet(
      range
        ? range.rest
        : single
          ? l
              .replace(single[1], '')
              .replace(/\(\s*\)|[,–-]\s*$/g, '')
              .trim()
          : l,
    );
    if (!title) continue;
    const prev = out[out.length - 1];
    // An undated short line right under a dated one is usually the issuer ("Google · Coursera").
    if (!range && !single && prev && !prev.subtitle && (prev.range.end.y || prev.range.start.y) && title.length < 60) {
      prev.subtitle = title;
      continue;
    }
    out.push(emptyEntry({ title, range: range ? range.range : { start: {}, end: single ? parsePoint(single[1]) : {}, current: false } }));
  }
  return out;
}

export function parseResumeText(raw: string[] | string, linkedin = false): ParsedCv {
  const lines = (Array.isArray(raw) ? raw : normalizeText(raw).split('\n')).map((l) => normalizeText(l).trim()).filter(Boolean);
  const personal: Partial<Personal> = {};
  const links: CvLink[] = [];
  const blocks: { key: HeadingKey | 'top'; lines: string[] }[] = [{ key: 'top', lines: [] }];
  for (const l of lines) {
    const h = headingOf(l);
    if (h) blocks.push({ key: h, lines: [] });
    else blocks[blocks.length - 1].lines.push(l);
  }

  const takeContact = (l: string): boolean => {
    let used = false;
    const email = EMAIL.exec(l);
    if (email && !personal.email) {
      personal.email = email[0];
      used = true;
    }
    const phone = PHONE.exec(l.replace(EMAIL, ''));
    if (phone && !personal.phone) {
      personal.phone = normalizePhone(phone[0]);
      used = true;
    }
    for (const m of l.replace(EMAIL, '').matchAll(new RegExp(URL, 'gi'))) {
      const url = m[0].replace(/\(LinkedIn\)|\(Portfolio\)/i, '');
      if (links.some((x) => x.url === url)) continue;
      links.push({ id: uid(), kind: guessKind(url) ?? 'portfolio', url, label: '' });
      used = true;
    }
    return used || /^\(?(linkedin|portfolio|personal|mobile|home|work)\)?$/i.test(l);
  };

  const unassigned: string[] = [];
  const sections: Section[] = [];
  for (const b of blocks) {
    if (b.key === 'top' || b.key === 'contact') {
      for (const l of b.lines) {
        if (takeContact(l)) continue;
        const kv = /^(nama|name|tempat,? tanggal lahir|ttl|alamat|address|jenis kelamin|gender|agama|status|kewarganegaraan|nationality)\s*[:：]\s*(.+)$/i.exec(l);
        if (kv) {
          const k = kv[1].toLowerCase();
          if (k.startsWith('nama') || k === 'name') personal.fullName ??= kv[2];
          else if (k.startsWith('alamat') || k === 'address') personal.address ??= kv[2];
          else if (k.startsWith('kewarga') || k === 'nationality') personal.nationality ??= kv[2];
          else if (k.startsWith('tempat') || k === 'ttl') personal.birthPlace ??= kv[2].split(',')[0].trim();
          continue;
        }
        if (b.key === 'top' && !personal.fullName && l.length < 60 && !/\d/.test(l)) personal.fullName = l;
        else if (b.key === 'top' && personal.fullName && !personal.headline && l.length < 100) personal.headline = l;
        else if (b.key === 'top' && !personal.city && LOCATION.test(l)) {
          const [city, region] = l.split(',').map((x) => x.trim());
          personal.city = city;
          personal.region = region;
        } else unassigned.push(l);
      }
      continue;
    }
    const type = b.key;
    const s = sections.find((x) => x.type === type) ?? emptySection(type);
    if (!sections.includes(s)) sections.push(s);
    if (type === 'summary') s.text = [s.text, b.lines.join(' ')].filter(Boolean).join('\n');
    else if (['skills', 'languages', 'hobbies'].includes(type)) s.entries.push(...parseList(b.lines, type));
    else if (['certifications', 'awards', 'training', 'publications'].includes(type)) s.entries.push(...parseSingles(b.lines));
    else s.entries.push(...parseDated(b.lines, type, linkedin));
  }
  if (links.length) personal.links = links;
  return { personal, sections: sections.filter((s) => s.text.trim() || s.entries.length), unassigned };
}
