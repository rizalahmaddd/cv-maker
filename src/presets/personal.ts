import type { Lang } from '../types';

type Options = Record<string, Record<Lang, string>>;

export const GENDERS: Options = {
  male: { id: 'Laki-laki', en: 'Male' },
  female: { id: 'Perempuan', en: 'Female' },
};

export const RELIGIONS: Options = {
  islam: { id: 'Islam', en: 'Islam' },
  protestant: { id: 'Kristen Protestan', en: 'Protestant Christian' },
  catholic: { id: 'Katolik', en: 'Catholic' },
  hindu: { id: 'Hindu', en: 'Hindu' },
  buddhist: { id: 'Buddha', en: 'Buddhist' },
  confucian: { id: 'Khonghucu', en: 'Confucian' },
};

export const MARITAL: Options = {
  single: { id: 'Belum menikah', en: 'Single' },
  married: { id: 'Menikah', en: 'Married' },
  divorced: { id: 'Cerai', en: 'Divorced' },
  widowed: { id: 'Cerai mati', en: 'Widowed' },
};

export const LICENSES = ['A', 'B1', 'B2', 'C', 'D'];

export const NATIONALITIES = ['Indonesia', 'Malaysia', 'Singapura', 'Filipina', 'Thailand', 'Vietnam', 'Timor Leste'];

// Older CVs (and pasted backups) stored these as free text; map them onto the fixed options where possible.
const ALIASES: Record<string, string> = {
  'laki-laki': 'male',
  'laki laki': 'male',
  pria: 'male',
  male: 'male',
  l: 'male',
  perempuan: 'female',
  wanita: 'female',
  female: 'female',
  p: 'female',
  islam: 'islam',
  muslim: 'islam',
  kristen: 'protestant',
  protestan: 'protestant',
  'kristen protestan': 'protestant',
  protestant: 'protestant',
  katolik: 'catholic',
  'kristen katolik': 'catholic',
  catholic: 'catholic',
  hindu: 'hindu',
  buddha: 'buddhist',
  budha: 'buddhist',
  buddhist: 'buddhist',
  khonghucu: 'confucian',
  konghucu: 'confucian',
  'belum menikah': 'single',
  lajang: 'single',
  single: 'single',
  menikah: 'married',
  'sudah menikah': 'married',
  kawin: 'married',
  married: 'married',
  cerai: 'divorced',
  'cerai hidup': 'divorced',
  divorced: 'divorced',
  'cerai mati': 'widowed',
  widowed: 'widowed',
};

export function canonical(value: string, options: Options): string {
  const v = value.trim();
  if (!v || options[v]) return v;
  const key = ALIASES[v.toLowerCase()];
  return key && options[key] ? key : v;
}

export function optionLabel(value: string, options: Options, lang: Lang): string {
  return options[value]?.[lang] ?? value;
}

export function digitsOnly(s: string, max = 3): string {
  return s.replace(/\D/g, '').slice(0, max);
}

export const EMPLOYMENT: Options = {
  fulltime: { id: 'Penuh waktu', en: 'Full-time' },
  parttime: { id: 'Paruh waktu', en: 'Part-time' },
  contract: { id: 'Kontrak', en: 'Contract' },
  freelance: { id: 'Freelance', en: 'Freelance' },
  internship: { id: 'Magang', en: 'Internship' },
  daily: { id: 'Harian lepas', en: 'Casual' },
  remote: { id: 'Remote', en: 'Remote' },
};

export const DEGREES: Options = {
  SD: { id: 'SD', en: 'Elementary School' },
  SMP: { id: 'SMP', en: 'Junior High School' },
  SMA: { id: 'SMA', en: 'Senior High School' },
  SMK: { id: 'SMK', en: 'Vocational High School' },
  MA: { id: 'MA', en: 'Islamic Senior High School' },
  D1: { id: 'D1', en: 'Diploma (D1)' },
  D2: { id: 'D2', en: 'Diploma (D2)' },
  D3: { id: 'D3', en: 'Associate Degree (D3)' },
  D4: { id: 'D4', en: 'Bachelor of Applied Science (D4)' },
  S1: { id: 'S1', en: "Bachelor's Degree" },
  S2: { id: 'S2', en: "Master's Degree" },
  S3: { id: 'S3', en: 'Doctorate' },
  profesi: { id: 'Pendidikan Profesi', en: 'Professional Degree' },
};

export const SCHOOL_LEVELS = new Set(['SD', 'SMP', 'SMA', 'SMK', 'MA']);

export const SCORE_SCALES = ['4', '5', '100'];

export function decimalInput(s: string): string {
  const cleaned = s.replace(/[^\d.,]/g, '').replace(',', '.');
  const [int, ...rest] = cleaned.split('.');
  return rest.length ? `${int.slice(0, 3)}.${rest.join('').slice(0, 2)}` : int.slice(0, 3);
}

export function formatScore(score: string, max: string, degree: string | undefined, lang: Lang): string {
  const n = Number(score);
  if (!score || Number.isNaN(n)) return '';
  const fmt = (x: number, digits: number) => x.toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: 2 });
  const scale = Number(max) || 4;
  const digits = scale <= 5 ? 2 : 0;
  const school = !!degree && SCHOOL_LEVELS.has(degree);
  const label = school || scale === 100 ? (lang === 'id' ? 'Nilai rata-rata' : 'Average score') : lang === 'id' ? 'IPK' : 'GPA';
  return `${label} ${fmt(n, digits)} / ${fmt(scale, digits)}`;
}

// Education typed before degree/GPA had their own fields, e.g. subtitle "S1 Manajemen" and extra "IPK 3,68 / 4,00".
export function splitLegacyEducation<T extends { subtitle: string; extra: string; degree?: string; score?: string; scoreMax?: string }>(e: T): T {
  if (e.degree !== undefined) return e;
  const out = { ...e, degree: '' };
  const d = /^\s*(SD|SMP|SMA|SMK|MA|D[1-4]|S[1-3])\b[\s,.-]*/i.exec(e.subtitle);
  if (d) {
    out.degree = d[1].toUpperCase();
    out.subtitle = e.subtitle.slice(d[0].length).trim();
  }
  const g = /(?:IPK|GPA|nilai(?: rata-rata)?)?\s*:?\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*\/\s*(\d{1,3})(?:[.,]0+)?/i.exec(e.extra);
  if (g) {
    out.score = g[1].replace(',', '.');
    out.scoreMax = SCORE_SCALES.includes(g[2]) ? g[2] : '4';
    out.extra = e.extra
      .replace(g[0], '')
      .replace(/^[\s·,;()-]+|[\s·,;()-]+$/g, '')
      .trim();
  }
  return out;
}
