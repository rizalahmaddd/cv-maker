import type { CvLink, LinkKind } from '../types';

export function normalizePhone(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  const digits = s.replace(/[^\d+]/g, '');
  if (/^\+?62/.test(digits)) return '+62 ' + groupDigits(digits.replace(/^\+?62/, '').replace(/^0/, ''));
  if (/^0\d{8,}/.test(digits)) return '+62 ' + groupDigits(digits.slice(1));
  return s;
}

function groupDigits(d: string): string {
  return d.replace(/^(\d{3})(\d{4})(\d{0,5})$/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));
}

export function phoneHasCountryCode(raw: string): boolean {
  return /^\s*(\+|00)/.test(raw);
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}

export function waLink(phone: string): string {
  const d = phone.replace(/\D/g, '').replace(/^0/, '62');
  return d ? `https://wa.me/${d}` : '';
}

const HOSTS: [LinkKind, RegExp][] = [
  ['linkedin', /linkedin\.com/i],
  ['github', /github\.com/i],
  ['instagram', /instagram\.com/i],
  ['behance', /behance\.net/i],
  ['dribbble', /dribbble\.com/i],
  ['youtube', /youtu\.?be/i],
  ['tiktok', /tiktok\.com/i],
];

export const LINK_NAMES: Record<LinkKind, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portofolio',
  website: 'Website',
  instagram: 'Instagram',
  behance: 'Behance',
  dribbble: 'Dribbble',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  other: 'Tautan',
};

export function guessKind(url: string): LinkKind | null {
  for (const [k, re] of HOSTS) if (re.test(url)) return k;
  return null;
}

export function normalizeUrl(raw: string, kind?: LinkKind): string {
  const s = raw.trim();
  if (!s) return '';
  if (s.startsWith('@')) {
    const h = s.slice(1);
    if (kind === 'instagram') return `https://instagram.com/${h}`;
    if (kind === 'github') return `https://github.com/${h}`;
    if (kind === 'tiktok') return `https://tiktok.com/@${h}`;
  }
  if (/^https?:\/\//i.test(s)) return s;
  if (/^mailto:|^tel:/i.test(s)) return s;
  return `https://${s.replace(/^\/+/, '')}`;
}

export function displayUrl(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
    .replace(/[?#].*$/, '');
}

export function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    return /^https?:$/.test(u.protocol) && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function linkHref(l: CvLink): string {
  return normalizeUrl(l.url, l.kind);
}
