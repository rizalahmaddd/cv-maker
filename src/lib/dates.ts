import type { DateFormat, DateRange, Lang, YM } from '../types';

const MONTHS: Record<Lang, string[]> = {
  id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const SHORT: Record<Lang, string[]> = {
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export const PRESENT: Record<Lang, string> = { id: 'Sekarang', en: 'Present' };

export function monthNames(lang: Lang, short = false) {
  return (short ? SHORT : MONTHS)[lang];
}

export function hasDate(d: YM | undefined): d is YM & { y: number } {
  return !!d && typeof d.y === 'number' && d.y > 0;
}

export function formatYM(d: YM | undefined, lang: Lang, fmt: DateFormat): string {
  if (!hasDate(d)) return '';
  const m = d.m && d.m >= 1 && d.m <= 12 ? d.m : 0;
  if (fmt === 'year' || !m) return String(d.y);
  if (fmt === 'numeric') return `${String(m).padStart(2, '0')}/${d.y}`;
  return `${(fmt === 'long' ? MONTHS : SHORT)[lang][m - 1]} ${d.y}`;
}

export function formatRange(r: DateRange | undefined, lang: Lang, fmt: DateFormat): string {
  if (!r) return '';
  const a = formatYM(r.start, lang, fmt);
  const b = r.current ? PRESENT[lang] : formatYM(r.end, lang, fmt);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  return a || b;
}

export function ymValue(d: YM | undefined): number {
  return hasDate(d) ? d.y * 12 + (d.m ? d.m - 1 : 0) : NaN;
}

export function nowYM(): YM {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1 };
}

function rangeKey(r: DateRange): [number, number] {
  const end = r.current ? Infinity : ymValue(hasDate(r.end) ? r.end : r.start);
  return [Number.isNaN(end) ? -Infinity : end, ymValue(r.start) || -Infinity];
}

export function compareRangeDesc(a: DateRange, b: DateRange): number {
  const [ea, sa] = rangeKey(a);
  const [eb, sb] = rangeKey(b);
  if (ea !== eb) return eb > ea ? 1 : -1;
  return sb === sa ? 0 : sb > sa ? 1 : -1;
}

export function formatDay(iso: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[lang][Number(m[2]) - 1]} ${m[1]}`;
}

export function ageFrom(iso: string, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  let age = today.getFullYear() - Number(m[1]);
  if (today.getMonth() + 1 < Number(m[2]) || (today.getMonth() + 1 === Number(m[2]) && today.getDate() < Number(m[3]))) age -= 1;
  return age;
}
