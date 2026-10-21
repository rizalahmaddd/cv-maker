import type { CountryKey, CvOptions, Lang, PaperKey, PersonalFlag, SectionType } from '../types';

export interface CountryPreset {
  key: CountryKey;
  name: string;
  lang: Lang;
  paper: PaperKey;
  photo: 'expected' | 'optional' | 'avoid';
  personal: Partial<Record<PersonalFlag, boolean>>;
  templateId: string;
  tip: string;
  sections?: SectionType[];
}

export const COUNTRIES: CountryPreset[] = [
  {
    key: 'ID',
    name: 'Indonesia',
    lang: 'id',
    paper: 'A4',
    photo: 'expected',
    personal: { birth: true, gender: true, nationality: false, address: true },
    templateId: 'formal-biru',
    tip: 'Foto formal 3×4 dan data diri singkat masih umum diminta HRD di Indonesia. Agama dan status pernikahan cukup dicantumkan bila diminta lowongan.',
  },
  {
    key: 'MY',
    name: 'Malaysia',
    lang: 'en',
    paper: 'A4',
    photo: 'expected',
    personal: { birth: true, nationality: true },
    templateId: 'modern-laut',
    tip: 'Foto dan kewarganegaraan biasa dicantumkan. Tulis dalam Bahasa Inggris.',
  },
  {
    key: 'SG',
    name: 'Singapura',
    lang: 'en',
    paper: 'A4',
    photo: 'optional',
    personal: { nationality: true },
    templateId: 'modern-laut',
    tip: 'Cantumkan kewarganegaraan dan status izin kerja. Foto opsional.',
  },
  {
    key: 'ME',
    name: 'Timur Tengah (UAE, Saudi, Qatar)',
    lang: 'en',
    paper: 'A4',
    photo: 'expected',
    personal: { birth: true, nationality: true, marital: true, gender: true },
    templateId: 'sidebar-navy',
    tip: 'Foto, kewarganegaraan, tanggal lahir, dan status pernikahan lazim dicantumkan. Sebutkan status paspor/visa.',
  },
  {
    key: 'JP',
    name: 'Jepang',
    lang: 'en',
    paper: 'A4',
    photo: 'expected',
    personal: { birth: true, gender: true, nationality: true },
    templateId: 'rirekisho',
    tip: 'Template Rirekisho (履歴書) mengikuti format resmi Jepang dan bisa diisi huruf Jepang. Perusahaan Jepang biasanya meminta foto 3×4 berlatar polos dan riwayat yang runtut. Cantumkan level JLPT.',
  },
  {
    key: 'KR',
    name: 'Korea Selatan',
    lang: 'en',
    paper: 'A4',
    photo: 'expected',
    personal: { birth: true, gender: true, nationality: true },
    templateId: 'formal-biru',
    tip: 'Foto formal umum dicantumkan. Sertakan skor TOPIK bila ada.',
  },
  {
    key: 'AU',
    name: 'Australia / Selandia Baru',
    lang: 'en',
    paper: 'A4',
    photo: 'avoid',
    personal: {},
    templateId: 'klasik',
    tip: 'Jangan cantumkan foto, umur, atau status pernikahan. Bagian "Referees" lazim di akhir CV.',
  },
  {
    key: 'UK',
    name: 'Inggris',
    lang: 'en',
    paper: 'A4',
    photo: 'avoid',
    personal: {},
    templateId: 'klasik',
    tip: 'CV 2 halaman, tanpa foto dan data pribadi. Fokus pada pencapaian.',
  },
  {
    key: 'EU',
    name: 'Eropa',
    lang: 'en',
    paper: 'A4',
    photo: 'optional',
    personal: { nationality: true },
    templateId: 'garis',
    tip: 'Foto opsional (umum di Jerman, jarang di Belanda/Skandinavia). Tulis kemampuan bahasa dengan level CEFR (A1–C2).',
  },
  {
    key: 'US',
    name: 'Amerika Serikat / Kanada',
    lang: 'en',
    paper: 'LETTER',
    photo: 'avoid',
    personal: {},
    templateId: 'klasik',
    tip: 'Resume 1 halaman untuk fresh graduate, kertas Letter, tanpa foto, umur, agama, atau status pernikahan.',
  },
  {
    key: 'INTL',
    name: 'Internasional / perusahaan global',
    lang: 'en',
    paper: 'A4',
    photo: 'optional',
    personal: {},
    templateId: 'modern-laut',
    tip: 'Pilih template ATS, tulis dalam Bahasa Inggris, dan hindari data pribadi yang tidak relevan.',
  },
];

export function countryPreset(key: CountryKey | undefined): CountryPreset {
  return COUNTRIES.find((c) => c.key === key) ?? COUNTRIES[0];
}

export const NO_PERSONAL: Record<PersonalFlag, boolean> = {
  birth: false,
  gender: false,
  religion: false,
  marital: false,
  nationality: false,
  body: false,
  license: false,
  address: false,
};

export function optionsForCountry(key: CountryKey): Pick<CvOptions, 'showPhoto' | 'personal'> {
  const c = countryPreset(key);
  return { showPhoto: c.photo !== 'avoid', personal: { ...NO_PERSONAL, ...c.personal } };
}
