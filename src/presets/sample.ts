import type { Cv, Entry, Lang, SectionType } from '../types';
import { blankCv, emptyEntry, emptySection } from '../db';

const e = (p: Partial<Entry>) => emptyEntry(p);

const CONTENT: Record<Lang, Partial<Record<SectionType, { text?: string; entries?: Partial<Entry>[] }>>> = {
  id: {
    summary: {
      text: 'Lulusan S1 Manajemen dengan pengalaman magang di bidang pemasaran digital dan pengalaman memimpin organisasi kampus. Terbiasa mengolah data penjualan dengan Excel dan membuat konten media sosial. Mencari posisi Marketing Staff untuk mengembangkan kemampuan analisis dan komunikasi.',
    },
    experience: {
      entries: [
        {
          title: 'Marketing Intern',
          subtitle: 'PT Sinar Niaga Nusantara',
          location: 'Surabaya',
          range: { start: { y: 2024, m: 2 }, end: { y: 2024, m: 7 }, current: false },
          extra: 'internship',
          details:
            'Membuat 60+ konten Instagram dan TikTok; engagement naik 32% dalam 4 bulan\nMenyusun laporan penjualan mingguan untuk 12 cabang dengan Excel (pivot, VLOOKUP)\nMembantu persiapan 3 pameran produk dengan total 1.200 pengunjung',
        },
        {
          title: 'Admin Toko Online (paruh waktu)',
          subtitle: 'Batik Arunika',
          location: 'Malang',
          range: { start: { y: 2022, m: 8 }, end: { y: 2023, m: 12 }, current: false },
          details: 'Mengelola pesanan Shopee dan Tokopedia, rata-rata 150 pesanan per bulan\nMembalas chat pelanggan dengan rating toko 4,9',
        },
      ],
    },
    education: {
      entries: [
        {
          title: 'Universitas Brawijaya',
          subtitle: 'Manajemen',
          degree: 'S1',
          score: '3.68',
          scoreMax: '4',
          location: 'Malang',
          range: { start: { y: 2020, m: 8 }, end: { y: 2024, m: 10 }, current: false },
          details: 'Skripsi: Pengaruh Konten Video Pendek terhadap Minat Beli Generasi Z',
        },
        {
          title: 'SMA Negeri 3 Malang',
          subtitle: 'IPS',
          degree: 'SMA',
          location: 'Malang',
          range: { start: { y: 2017 }, end: { y: 2020 }, current: false },
        },
      ],
    },
    organization: {
      entries: [
        {
          title: 'Kepala Divisi Humas',
          subtitle: 'BEM Fakultas Ekonomi dan Bisnis',
          range: { start: { y: 2022, m: 3 }, end: { y: 2023, m: 2 }, current: false },
          details: 'Memimpin 10 anggota dan menjalin kerja sama dengan 8 sponsor acara',
        },
      ],
    },
    skills: {
      entries: [
        { title: 'Microsoft Excel', subtitle: 'Hard skill', level: 4 },
        { title: 'Digital Marketing', subtitle: 'Hard skill', level: 4 },
        { title: 'Canva', subtitle: 'Hard skill', level: 5 },
        { title: 'Google Analytics', subtitle: 'Hard skill', level: 3 },
        { title: 'Komunikasi', subtitle: 'Soft skill', level: 4 },
        { title: 'Kerja tim', subtitle: 'Soft skill', level: 5 },
      ],
    },
    languages: {
      entries: [
        { title: 'Bahasa Indonesia', subtitle: 'Bahasa ibu', level: 5 },
        { title: 'Bahasa Inggris', subtitle: 'Aktif', extra: 'TOEFL ITP 543', level: 4 },
      ],
    },
    certifications: {
      entries: [
        { title: 'Google Digital Marketing & E-commerce', subtitle: 'Google · Coursera', range: { start: {}, end: { y: 2024, m: 5 }, current: false } },
        { title: 'Sertifikat Kompetensi Pemasaran', subtitle: 'BNSP', range: { start: {}, end: { y: 2023, m: 11 }, current: false } },
      ],
    },
  },
  en: {
    summary: {
      text: 'Management graduate with a digital marketing internship and campus leadership experience. Comfortable analysing sales data in Excel and producing social media content. Looking for a Marketing Staff role to grow analytical and communication skills.',
    },
    experience: {
      entries: [
        {
          title: 'Marketing Intern',
          subtitle: 'PT Sinar Niaga Nusantara',
          location: 'Surabaya',
          range: { start: { y: 2024, m: 2 }, end: { y: 2024, m: 7 }, current: false },
          details:
            'Produced 60+ Instagram and TikTok posts; engagement grew 32% in 4 months\nBuilt weekly sales reports for 12 branches in Excel (pivot tables, VLOOKUP)\nHelped run 3 product exhibitions with 1,200 visitors in total',
        },
        {
          title: 'Online Store Admin (part-time)',
          subtitle: 'Batik Arunika',
          location: 'Malang',
          range: { start: { y: 2022, m: 8 }, end: { y: 2023, m: 12 }, current: false },
          details: 'Handled about 150 marketplace orders per month\nKept a 4.9 store rating through quick customer replies',
        },
      ],
    },
    education: {
      entries: [
        {
          title: 'Universitas Brawijaya',
          subtitle: 'Management',
          degree: 'S1',
          score: '3.68',
          scoreMax: '4',
          location: 'Malang, Indonesia',
          range: { start: { y: 2020, m: 8 }, end: { y: 2024, m: 10 }, current: false },
          details: 'Thesis: The Effect of Short Video Content on Gen Z Purchase Intention',
        },
      ],
    },
    organization: {
      entries: [
        {
          title: 'Head of Public Relations',
          subtitle: 'Student Executive Board, Faculty of Economics and Business',
          range: { start: { y: 2022, m: 3 }, end: { y: 2023, m: 2 }, current: false },
          details: 'Led a team of 10 and secured 8 event sponsors',
        },
      ],
    },
    skills: {
      entries: [
        { title: 'Microsoft Excel', subtitle: 'Technical', level: 4 },
        { title: 'Digital Marketing', subtitle: 'Technical', level: 4 },
        { title: 'Canva', subtitle: 'Technical', level: 5 },
        { title: 'Google Analytics', subtitle: 'Technical', level: 3 },
        { title: 'Communication', subtitle: 'Interpersonal', level: 4 },
        { title: 'Teamwork', subtitle: 'Interpersonal', level: 5 },
      ],
    },
    languages: {
      entries: [
        { title: 'Indonesian', subtitle: 'Native', level: 5 },
        { title: 'English', subtitle: 'Professional working', extra: 'TOEFL ITP 543', level: 4 },
      ],
    },
    certifications: {
      entries: [{ title: 'Google Digital Marketing & E-commerce', subtitle: 'Google · Coursera', range: { start: {}, end: { y: 2024, m: 5 }, current: false } }],
    },
  },
};

export function sampleCv(lang: Lang = 'id', templateId = 'klasik'): Cv {
  const cv = blankCv(lang === 'id' ? 'ID' : 'INTL', lang, templateId);
  cv.id = 'sample';
  cv.title = 'Contoh CV';
  cv.targetRole = 'Marketing Staff';
  cv.personal = {
    ...cv.personal,
    fullName: 'Nadia Putri Rahmawati',
    suffix: 'S.M.',
    headline: lang === 'id' ? 'Fresh Graduate Manajemen Pemasaran' : 'Marketing Management Graduate',
    email: 'nadia.rahmawati@gmail.com',
    phone: '+62 812-3456-7890',
    city: 'Malang',
    region: 'Jawa Timur',
    country: 'Indonesia',
    address: 'Jl. Soekarno Hatta No. 12, Lowokwaru, Malang',
    links: [{ id: 'l1', kind: 'linkedin', url: 'linkedin.com/in/nadiaputri', label: '' }],
    birthPlace: 'Malang',
    birthDate: '2002-04-17',
    gender: 'female',
    nationality: lang === 'id' ? 'Indonesia' : 'Indonesian',
    maritalStatus: 'single',
  };
  const content = CONTENT[lang];
  cv.sections = (Object.keys(content) as SectionType[]).map((type) => {
    const s = emptySection(type);
    s.id = `s-${type}`;
    s.text = content[type]?.text ?? '';
    s.entries = (content[type]?.entries ?? []).map((p, i) => e({ ...p, id: `${type}-${i}` }));
    return s;
  });
  return cv;
}
