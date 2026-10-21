import { describe, expect, it } from 'vitest';
import { parseResumeText } from '../import/parse';

const ID_CV = `Budi Santoso
Staff Gudang
budi.santoso@gmail.com | 0812-3456-7890 | Surabaya, Jawa Timur
linkedin.com/in/budisantoso

RINGKASAN
Staf gudang berpengalaman 3 tahun dalam stock opname dan pengiriman.

PENGALAMAN KERJA
Staff Gudang - PT Logistik Jaya
Januari 2021 - Sekarang
• Mengelola 1.500 SKU dengan akurasi 99%
• Menyiapkan 300 pengiriman per hari
Helper Gudang | CV Maju
Mar 2019 – Des 2020
- Bongkar muat barang

PENDIDIKAN
SMK Negeri 1 Surabaya
SMK Teknik Mesin
2016 - 2019

KEAHLIAN
Forklift, Stock opname, Excel

BAHASA
Bahasa Indonesia (Bahasa ibu)
Bahasa Inggris - Pasif

SERTIFIKASI
Operator Forklift (SIO) 2022`;

describe('parseResumeText', () => {
  const r = parseResumeText(ID_CV);
  it('reads contact details', () => {
    expect(r.personal).toMatchObject({ fullName: 'Budi Santoso', headline: 'Staff Gudang', email: 'budi.santoso@gmail.com', phone: '+62 812-3456-7890' });
    expect(r.personal.links?.[0]).toMatchObject({ kind: 'linkedin' });
  });
  it('splits experience entries by date ranges', () => {
    const exp = r.sections.find((s) => s.type === 'experience')!;
    expect(exp.entries).toHaveLength(2);
    expect(exp.entries[0]).toMatchObject({ title: 'Staff Gudang', subtitle: 'PT Logistik Jaya', range: { start: { y: 2021, m: 1 }, current: true } });
    expect(exp.entries[0].details.split('\n')).toHaveLength(2);
    expect(exp.entries[1]).toMatchObject({ title: 'Helper Gudang', subtitle: 'CV Maju', range: { start: { y: 2019, m: 3 }, end: { y: 2020, m: 12 } } });
  });
  it('detects degree in education', () => {
    const edu = r.sections.find((s) => s.type === 'education')!;
    expect(edu.entries[0]).toMatchObject({ title: 'SMK Negeri 1 Surabaya', degree: 'SMK', subtitle: 'Teknik Mesin' });
  });
  it('splits skills and languages', () => {
    expect(r.sections.find((s) => s.type === 'skills')!.entries.map((e) => e.title)).toEqual(['Forklift', 'Stock opname', 'Excel']);
    expect(r.sections.find((s) => s.type === 'languages')!.entries[1]).toMatchObject({ title: 'Bahasa Inggris', subtitle: 'Pasif' });
  });
  it('reads single-date certifications', () => {
    expect(r.sections.find((s) => s.type === 'certifications')!.entries[0]).toMatchObject({ title: 'Operator Forklift (SIO)', range: { end: { y: 2022 } } });
  });
});

describe('LinkedIn order', () => {
  const text = `Siti Aminah
Digital Marketing Specialist
Jakarta, Indonesia
Summary
Marketer focused on paid ads.
Experience
PT Iklan Kreatif
Digital Marketing Specialist
June 2022 - Present (2 years 5 months)
Jakarta, Indonesia
Managed Meta Ads budget
Education
Universitas Indonesia
Bachelor's degree, Communication · (2017 - 2021)
Contact
siti@mail.com
www.linkedin.com/in/siti (LinkedIn)
Top Skills
Meta Ads
SEO`;
  const r = parseResumeText(text, true);
  it('maps company/title order and location', () => {
    const e = r.sections.find((s) => s.type === 'experience')!.entries[0];
    expect(e).toMatchObject({ title: 'Digital Marketing Specialist', subtitle: 'PT Iklan Kreatif', location: 'Jakarta, Indonesia', details: 'Managed Meta Ads budget' });
    expect(r.personal).toMatchObject({ fullName: 'Siti Aminah', city: 'Jakarta', email: 'siti@mail.com' });
  });
  it('reads education with inline dates', () => {
    const e = r.sections.find((s) => s.type === 'education')!.entries[0];
    expect(e).toMatchObject({ title: 'Universitas Indonesia', range: { start: { y: 2017 }, end: { y: 2021 } } });
    expect(e.subtitle).toContain('Communication');
  });
});

describe('title and date on one line', () => {
  const text = `Nadia Putri
PENDIDIKAN
Universitas Brawijaya Agu 2020 – Okt 2024
S1 Manajemen · Malang
IPK 3,68 / 4,00
Skripsi: Pengaruh Konten Video
SMA Negeri 3 Malang 2017 – 2020
SMA IPS · Malang
KEAHLIAN
Hard skill: Microsoft Excel, Canva
Soft skill: Komunikasi
BAHASA
Bahasa Indonesia · Bahasa ibu
Bahasa Inggris · Aktif`;
  const r = parseResumeText(text);
  it('keeps each school intact', () => {
    const [a, b] = r.sections.find((s) => s.type === 'education')!.entries;
    expect(a).toMatchObject({ title: 'Universitas Brawijaya', degree: 'S1', subtitle: 'Manajemen', location: 'Malang', score: '3.68', scoreMax: '4' });
    expect(a.details).toBe('Skripsi: Pengaruh Konten Video');
    expect(b).toMatchObject({ title: 'SMA Negeri 3 Malang', degree: 'SMA', subtitle: 'IPS', range: { start: { y: 2017 }, end: { y: 2020 } } });
  });
  it('groups skills by label', () => {
    expect(r.sections.find((s) => s.type === 'skills')!.entries.map((e) => [e.subtitle, e.title])).toEqual([
      ['Hard skill', 'Microsoft Excel'],
      ['Hard skill', 'Canva'],
      ['Soft skill', 'Komunikasi'],
    ]);
  });
  it('reads language levels', () => {
    expect(r.sections.find((s) => s.type === 'languages')!.entries.map((e) => [e.title, e.subtitle])).toEqual([
      ['Bahasa Indonesia', 'Bahasa ibu'],
      ['Bahasa Inggris', 'Aktif'],
    ]);
  });
});

it('keeps parentheses that belong to a title', () => {
  const r = parseResumeText('X\nPENGALAMAN KERJA\nAdmin Toko Online (paruh waktu) Agu 2022 – Des 2023\nBatik Arunika · Malang\n- Mengelola pesanan');
  expect(r.sections[0].entries[0]).toMatchObject({ title: 'Admin Toko Online (paruh waktu)', subtitle: 'Batik Arunika', location: 'Malang' });
});
