import { uid } from './lib/id';
import type { AtsLevel, FontKey, LayoutKey, PaperKey, TemplateConfig, TemplateStyle } from './types';

export type LayoutCategory = 'ats' | 'formal' | 'modern' | 'kreatif';

export const CATEGORIES: { key: LayoutCategory; name: string; hint: string }[] = [
  { key: 'ats', name: 'Siap ATS', hint: 'Satu kolom, mudah dibaca sistem rekrutmen' },
  { key: 'formal', name: 'Formal', hint: 'Dengan foto dan data diri, gaya Indonesia' },
  { key: 'modern', name: 'Modern', hint: 'Berwarna, dua kolom' },
  { key: 'kreatif', name: 'Kreatif', hint: 'Untuk desain, media, dan industri kreatif' },
];

export const LAYOUTS: { key: LayoutKey; name: string; hint: string; category: LayoutCategory; ats: AtsLevel; photo: boolean }[] = [
  { key: 'klasik', name: 'Klasik', hint: 'Satu kolom, judul bagian bergaris, paling aman untuk ATS', category: 'ats', ats: 'safe', photo: false },
  { key: 'garis', name: 'Garis Waktu', hint: 'Tanggal di kolom kiri, isi di kanan', category: 'ats', ats: 'safe', photo: false },
  { key: 'modern', name: 'Modern', hint: 'Nama berwarna, foto opsional di kanan atas', category: 'ats', ats: 'safe', photo: true },
  { key: 'formal', name: 'Formal', hint: 'Foto 3×4 dan tabel data diri ala CV Indonesia', category: 'formal', ats: 'partial', photo: true },
  { key: 'sidebar', name: 'Sidebar', hint: 'Kolom warna berisi foto, kontak, dan keahlian', category: 'modern', ats: 'partial', photo: true },
  { key: 'europass', name: 'Europass', hint: 'Judul bagian di kolom kiri, gaya CV Eropa', category: 'ats', ats: 'safe', photo: true },
  { key: 'drh', name: 'Daftar Riwayat Hidup', hint: 'Format resmi bernomor dengan tabel data diri dan tanda tangan, untuk instansi & BUMN', category: 'formal', ats: 'partial', photo: true },
  { key: 'timeline', name: 'Timeline', hint: 'Garis waktu dengan titik di setiap pengalaman', category: 'modern', ats: 'partial', photo: true },
  { key: 'kepala', name: 'Kepala Warna', hint: 'Blok warna penuh di atas dengan foto bulat', category: 'kreatif', ats: 'partial', photo: true },
  { key: 'rirekisho', name: 'Rirekisho (Jepang)', hint: 'Format resmi 履歴書 standar JIS untuk melamar ke Jepang', category: 'formal', ats: 'partial', photo: true },
  { key: 'kreatif', name: 'Kreatif', hint: 'Nama besar, dua kolom, hiasan bentuk lengkung', category: 'kreatif', ats: 'unsafe', photo: true },
];

export const FONTS: { key: FontKey; name: string; kind: 'sans' | 'serif' | 'mono' }[] = [
  { key: 'jakarta', name: 'Plus Jakarta Sans', kind: 'sans' },
  { key: 'inter', name: 'Inter', kind: 'sans' },
  { key: 'plex', name: 'IBM Plex Sans', kind: 'sans' },
  { key: 'grotesk', name: 'Space Grotesk', kind: 'sans' },
  { key: 'poppins', name: 'Poppins', kind: 'sans' },
  { key: 'montserrat', name: 'Montserrat', kind: 'sans' },
  { key: 'outfit', name: 'Outfit', kind: 'sans' },
  { key: 'helvetica', name: 'Helvetica', kind: 'sans' },
  { key: 'lora', name: 'Lora', kind: 'serif' },
  { key: 'playfair', name: 'Playfair Display', kind: 'serif' },
  { key: 'fraunces', name: 'Fraunces', kind: 'serif' },
  { key: 'dmserif', name: 'DM Serif Display', kind: 'serif' },
  { key: 'times', name: 'Times', kind: 'serif' },
  { key: 'mono', name: 'JetBrains Mono', kind: 'mono' },
  { key: 'spacemono', name: 'Space Mono', kind: 'mono' },
];

export const FONT_PAIRS: { name: string; heading: FontKey; body: FontKey }[] = [
  { name: 'Bersih', heading: 'jakarta', body: 'jakarta' },
  { name: 'Netral', heading: 'inter', body: 'inter' },
  { name: 'Startup', heading: 'outfit', body: 'inter' },
  { name: 'Ramah', heading: 'poppins', body: 'poppins' },
  { name: 'Korporat', heading: 'montserrat', body: 'inter' },
  { name: 'Teknis', heading: 'grotesk', body: 'plex' },
  { name: 'Editorial', heading: 'fraunces', body: 'inter' },
  { name: 'Mewah', heading: 'dmserif', body: 'lora' },
  { name: 'Klasik', heading: 'playfair', body: 'lora' },
  { name: 'Akademik', heading: 'times', body: 'times' },
  { name: 'Standar', heading: 'helvetica', body: 'helvetica' },
];

export const PALETTES: { name: string; primary: string; accent: string; side?: string }[] = [
  { name: 'Hitam', primary: '#111111', accent: '#444444' },
  { name: 'Biru korporat', primary: '#1e3a8a', accent: '#2563eb' },
  { name: 'Navy', primary: '#14213d', accent: '#c58b2a' },
  { name: 'Laut', primary: '#0e5a74', accent: '#0e7490' },
  { name: 'Hutan', primary: '#1f4d3a', accent: '#2f7d5b' },
  { name: 'Teal', primary: '#0f5257', accent: '#e07a5f' },
  { name: 'Indigo', primary: '#3730a3', accent: '#6366f1' },
  { name: 'Ungu', primary: '#4c1d95', accent: '#7c3aed' },
  { name: 'Anggur', primary: '#5b1f3a', accent: '#a23b5e' },
  { name: 'Merah bata', primary: '#9a3412', accent: '#c2410c' },
  { name: 'Grafit', primary: '#2f3437', accent: '#5b6770' },
  { name: 'Cokelat', primary: '#3f2a1d', accent: '#9a6b3c' },
];

export const PAPERS: { key: PaperKey; name: string }[] = [
  { key: 'A4', name: 'A4' },
  { key: 'LETTER', name: 'Letter (AS)' },
  { key: 'F4', name: 'F4 / Folio' },
  { key: 'LEGAL', name: 'Legal' },
];

export const BASE_STYLE: TemplateStyle = {
  fontScale: 1,
  margin: 'normal',
  density: 'normal',
  heading: 'line',
  headingCase: 'upper',
  photoShape: 'rounded',
  skills: 'text',
  icons: false,
  headerAlign: 'left',
  sideWidth: 32,
  datePosition: 'right',
};

const BASE_COLORS: TemplateConfig['colors'] = {
  primary: '#111111',
  accent: '#444444',
  text: '#1f2328',
  muted: '#5b6168',
  paper: '#ffffff',
  side: '#f3f4f6',
};

// Templates saved before a field existed are filled in here, so every reader can rely on the full shape.
export function normalizeTemplate(t: TemplateConfig): TemplateConfig {
  return {
    ...t,
    layout: LAYOUTS.some((l) => l.key === t.layout) ? t.layout : 'klasik',
    colors: { ...BASE_COLORS, ...t.colors },
    fonts: { heading: t.fonts?.heading ?? 'jakarta', body: t.fonts?.body ?? 'jakarta' },
    style: { ...BASE_STYLE, ...t.style },
    labels: { id: { ...t.labels?.id }, en: { ...t.labels?.en } },
    paper: t.paper ?? 'A4',
  };
}

export function layoutMeta(key: LayoutKey) {
  return LAYOUTS.find((l) => l.key === key) ?? LAYOUTS[0];
}

export function templateAts(t: TemplateConfig): AtsLevel {
  const base = layoutMeta(t.layout).ats;
  if (base === 'safe' && (t.style.skills === 'bars' || t.style.skills === 'dots')) return 'partial';
  return base;
}

type PresetInput = Pick<TemplateConfig, 'id' | 'name' | 'layout'> & {
  colors?: Partial<TemplateConfig['colors']>;
  fonts?: TemplateConfig['fonts'];
  style?: Partial<TemplateStyle>;
  paper?: PaperKey;
};

function preset(p: PresetInput): TemplateConfig {
  return normalizeTemplate({
    builtin: true,
    paper: 'A4',
    labels: { id: {}, en: {} },
    ...p,
    fonts: p.fonts ?? { heading: 'jakarta', body: 'jakarta' },
    colors: { ...BASE_COLORS, ...p.colors },
    style: { ...BASE_STYLE, ...p.style },
  });
}

export const BUILTIN_TEMPLATES: TemplateConfig[] = [
  preset({
    id: 'klasik',
    name: 'Klasik ATS',
    layout: 'klasik',
    fonts: { heading: 'inter', body: 'inter' },
  }),
  preset({
    id: 'harvard',
    name: 'Harvard',
    layout: 'klasik',
    fonts: { heading: 'times', body: 'times' },
    style: { headerAlign: 'center', heading: 'line', headingCase: 'upper', fontScale: 1.05 },
  }),
  preset({
    id: 'klasik-biru',
    name: 'Klasik Biru',
    layout: 'klasik',
    colors: { primary: '#1e3a8a', accent: '#1e3a8a' },
    fonts: { heading: 'montserrat', body: 'inter' },
    style: { heading: 'underline' },
  }),
  preset({
    id: 'garis',
    name: 'Garis Waktu',
    layout: 'garis',
    colors: { primary: '#0f172a', accent: '#334155' },
    fonts: { heading: 'plex', body: 'plex' },
    style: { heading: 'plain', datePosition: 'left' },
  }),
  preset({
    id: 'garis-hijau',
    name: 'Garis Hijau',
    layout: 'garis',
    colors: { primary: '#1f4d3a', accent: '#2f7d5b' },
    fonts: { heading: 'fraunces', body: 'inter' },
    style: { heading: 'plain', datePosition: 'left', headingCase: 'normal' },
  }),
  preset({
    id: 'modern-laut',
    name: 'Modern Laut',
    layout: 'modern',
    colors: { primary: '#0e5a74', accent: '#0e7490' },
    fonts: { heading: 'outfit', body: 'inter' },
    style: { heading: 'bar', headingCase: 'normal' },
  }),
  preset({
    id: 'modern-indigo',
    name: 'Modern Indigo',
    layout: 'modern',
    colors: { primary: '#3730a3', accent: '#4f46e5' },
    fonts: { heading: 'poppins', body: 'poppins' },
    style: { heading: 'line', skills: 'tags', photoShape: 'circle' },
  }),
  preset({
    id: 'formal-biru',
    name: 'Formal Biru',
    layout: 'formal',
    colors: { primary: '#1e3a8a', accent: '#1e40af' },
    fonts: { heading: 'jakarta', body: 'jakarta' },
    style: { heading: 'block', photoShape: 'square' },
  }),
  preset({
    id: 'formal-hitam',
    name: 'Formal Hitam',
    layout: 'formal',
    colors: { primary: '#111111', accent: '#333333' },
    fonts: { heading: 'helvetica', body: 'helvetica' },
    style: { heading: 'line', photoShape: 'square' },
  }),
  preset({
    id: 'sidebar-navy',
    name: 'Sidebar Navy',
    layout: 'sidebar',
    colors: { primary: '#14213d', accent: '#c58b2a', side: '#14213d' },
    fonts: { heading: 'montserrat', body: 'inter' },
    style: { heading: 'plain', skills: 'bars', photoShape: 'circle' },
  }),
  preset({
    id: 'sidebar-abu',
    name: 'Sidebar Abu',
    layout: 'sidebar',
    colors: { primary: '#2f3437', accent: '#0f766e', side: '#eef1f2' },
    fonts: { heading: 'jakarta', body: 'jakarta' },
    style: { heading: 'line', skills: 'dots', photoShape: 'rounded' },
  }),
  preset({
    id: 'sidebar-hijau',
    name: 'Sidebar Hijau',
    layout: 'sidebar',
    colors: { primary: '#1f4d3a', accent: '#c08a2e', side: '#1f4d3a' },
    fonts: { heading: 'fraunces', body: 'lora' },
    style: { heading: 'plain', skills: 'text', photoShape: 'circle', headingCase: 'normal' },
  }),
  preset({
    id: 'kepala-ungu',
    name: 'Kepala Ungu',
    layout: 'kepala',
    colors: { primary: '#4c1d95', accent: '#7c3aed' },
    fonts: { heading: 'poppins', body: 'poppins' },
    style: { heading: 'bar', skills: 'tags', photoShape: 'circle', headingCase: 'normal' },
  }),
  preset({
    id: 'kepala-teal',
    name: 'Kepala Teal',
    layout: 'kepala',
    colors: { primary: '#0f5257', accent: '#e07a5f' },
    fonts: { heading: 'grotesk', body: 'inter' },
    style: { heading: 'underline', skills: 'bars', photoShape: 'rounded' },
  }),
  preset({
    id: 'rirekisho',
    name: 'Rirekisho 履歴書',
    layout: 'rirekisho',
    colors: { primary: '#111111', accent: '#111111' },
    style: { photoShape: 'square' },
  }),
  preset({
    id: 'elegan',
    name: 'Elegan',
    layout: 'klasik',
    colors: { primary: '#2b2118', accent: '#8a6a3d' },
    fonts: { heading: 'playfair', body: 'lora' },
    style: { headerAlign: 'center', heading: 'line', headingCase: 'normal' },
  }),
  preset({
    id: 'ringkas',
    name: 'Ringkas 1 Halaman',
    layout: 'klasik',
    colors: { primary: '#111827', accent: '#374151' },
    fonts: { heading: 'inter', body: 'inter' },
    style: { density: 'compact', margin: 'narrow', fontScale: 0.95, heading: 'line' },
  }),
  preset({
    id: 'akademik',
    name: 'Akademik',
    layout: 'garis',
    colors: { primary: '#1a1a1a', accent: '#7a1f1f' },
    fonts: { heading: 'times', body: 'times' },
    style: { heading: 'line', datePosition: 'left', fontScale: 1.05 },
  }),
  preset({
    id: 'europass',
    name: 'Europass Biru',
    layout: 'europass',
    colors: { primary: '#0b3d91', accent: '#2d6cdf' },
    fonts: { heading: 'plex', body: 'plex' },
    style: { headingCase: 'upper', photoShape: 'square' },
  }),
  preset({
    id: 'europass-grafit',
    name: 'Europass Grafit',
    layout: 'europass',
    colors: { primary: '#2f3437', accent: '#0f766e' },
    fonts: { heading: 'montserrat', body: 'inter' },
    style: { headingCase: 'normal', photoShape: 'rounded' },
  }),
  preset({
    id: 'drh',
    name: 'Daftar Riwayat Hidup',
    layout: 'drh',
    colors: { primary: '#111111', accent: '#111111' },
    fonts: { heading: 'times', body: 'times' },
    paper: 'F4',
  }),
  preset({
    id: 'drh-a4',
    name: 'Riwayat Hidup A4',
    layout: 'drh',
    colors: { primary: '#1e3a8a', accent: '#1e3a8a' },
    fonts: { heading: 'helvetica', body: 'helvetica' },
  }),
  preset({
    id: 'timeline-teal',
    name: 'Timeline Teal',
    layout: 'timeline',
    colors: { primary: '#0f5257', accent: '#14b8a6' },
    fonts: { heading: 'outfit', body: 'inter' },
    style: { heading: 'plain', photoShape: 'circle', skills: 'tags', headingCase: 'normal' },
  }),
  preset({
    id: 'timeline-merah',
    name: 'Timeline Merah Bata',
    layout: 'timeline',
    colors: { primary: '#7c2d12', accent: '#c2410c' },
    fonts: { heading: 'fraunces', body: 'inter' },
    style: { heading: 'underline', photoShape: 'rounded' },
  }),
  preset({
    id: 'kreatif-oranye',
    name: 'Kreatif Oranye',
    layout: 'kreatif',
    colors: { primary: '#1f2937', accent: '#ea580c' },
    fonts: { heading: 'poppins', body: 'poppins' },
    style: { heading: 'bar', skills: 'bars', headingCase: 'normal' },
  }),
  preset({
    id: 'kreatif-ungu',
    name: 'Kreatif Ungu',
    layout: 'kreatif',
    colors: { primary: '#3b0764', accent: '#a855f7' },
    fonts: { heading: 'grotesk', body: 'inter' },
    style: { heading: 'underline', skills: 'tags', headingCase: 'normal' },
  }),
  preset({
    id: 'modern-hijau',
    name: 'Modern Hutan',
    layout: 'modern',
    colors: { primary: '#1f4d3a', accent: '#2f7d5b' },
    fonts: { heading: 'jakarta', body: 'jakarta' },
    style: { heading: 'block', photoShape: 'rounded' },
  }),
  preset({
    id: 'formal-merah',
    name: 'Formal Merah',
    layout: 'formal',
    colors: { primary: '#991b1b', accent: '#b91c1c' },
    fonts: { heading: 'montserrat', body: 'inter' },
    style: { heading: 'underline', photoShape: 'square' },
  }),
  preset({
    id: 'sidebar-ungu',
    name: 'Sidebar Ungu',
    layout: 'sidebar',
    colors: { primary: '#4c1d95', accent: '#c4b5fd', side: '#4c1d95' },
    fonts: { heading: 'poppins', body: 'poppins' },
    style: { heading: 'plain', skills: 'dots', photoShape: 'circle', headingCase: 'normal' },
  }),
  preset({
    id: 'kepala-navy',
    name: 'Kepala Navy',
    layout: 'kepala',
    colors: { primary: '#14213d', accent: '#c58b2a' },
    fonts: { heading: 'montserrat', body: 'inter' },
    style: { heading: 'line', skills: 'text', photoShape: 'circle' },
  }),
];

export const DEFAULT_TEMPLATE_ID = 'klasik';

export function copyOfTemplate(src: TemplateConfig, name?: string): TemplateConfig {
  const now = Date.now();
  return { ...structuredClone(src), id: uid(), builtin: false, baseId: src.builtin ? src.id : src.baseId, name: name ?? `${src.name} (saya)`, createdAt: now, updatedAt: now };
}

export function parseTemplateFile(text: string): TemplateConfig {
  let t: Partial<TemplateConfig>;
  try {
    t = JSON.parse(text);
  } catch {
    throw new Error('File template tidak valid.');
  }
  if (!t || typeof t !== 'object' || !t.layout || !t.colors || !t.fonts) throw new Error('File ini bukan template CV Maker.');
  return copyOfTemplate(normalizeTemplate({ ...(t as TemplateConfig), builtin: false }), t.name || 'Template impor');
}
