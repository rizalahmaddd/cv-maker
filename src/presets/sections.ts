import type { Lang, SectionType } from '../types';
import { EMPLOYMENT } from './personal';

export type EntryField = 'title' | 'subtitle' | 'location' | 'range' | 'details' | 'extra' | 'link' | 'level';

export interface SectionDef {
  options?: Partial<Record<EntryField, Record<string, Record<Lang, string>>>>;
  type: SectionType;
  name: Record<Lang, string>;
  hint: string;
  kind: 'text' | 'entries' | 'list';
  side?: boolean;
  fields: Partial<Record<EntryField, { label: string; placeholder?: string }>>;
  singleDate?: boolean;
  addLabel?: string;
}

export const SECTION_DEFS: Record<SectionType, SectionDef> = {
  summary: {
    type: 'summary',
    name: { id: 'Ringkasan', en: 'Summary' },
    hint: '2–4 kalimat: siapa Anda, keahlian utama, dan apa yang Anda cari.',
    kind: 'text',
    fields: {},
  },
  experience: {
    type: 'experience',
    name: { id: 'Pengalaman Kerja', en: 'Work Experience' },
    hint: 'Mulai dari yang terbaru. Tulis hasil kerja, bukan hanya tugas.',
    kind: 'entries',
    addLabel: 'Tambah pengalaman',
    options: { extra: EMPLOYMENT },
    fields: {
      title: { label: 'Posisi / jabatan', placeholder: 'Staf Administrasi' },
      subtitle: { label: 'Perusahaan', placeholder: 'PT Maju Bersama' },
      location: { label: 'Kota', placeholder: 'Surabaya' },
      range: { label: 'Periode' },
      extra: { label: 'Jenis pekerjaan' },
      details: { label: 'Tanggung jawab & pencapaian', placeholder: 'Mengelola 300+ dokumen pengiriman per bulan tanpa selisih\nMenyusun laporan stok mingguan untuk 3 gudang' },
    },
  },
  internship: {
    type: 'internship',
    name: { id: 'Magang / PKL', en: 'Internship' },
    hint: 'Magang, PKL, praktik kerja industri, atau program MSIB.',
    kind: 'entries',
    addLabel: 'Tambah magang',
    fields: {
      title: { label: 'Posisi', placeholder: 'Intern Digital Marketing' },
      subtitle: { label: 'Perusahaan / instansi', placeholder: 'PT Telkom Indonesia' },
      location: { label: 'Kota', placeholder: 'Bandung' },
      range: { label: 'Periode' },
      details: { label: 'Kegiatan & hasil', placeholder: 'Membuat 40 konten Instagram, engagement naik 25%' },
    },
  },
  education: {
    type: 'education',
    name: { id: 'Pendidikan', en: 'Education' },
    hint: 'Pendidikan tertinggi di atas. Lulusan kuliah cukup mencantumkan sampai SMA/SMK.',
    kind: 'entries',
    addLabel: 'Tambah pendidikan',
    fields: {
      title: { label: 'Sekolah / kampus', placeholder: 'Universitas Brawijaya' },
      subtitle: { label: 'Jurusan / program studi', placeholder: 'Teknik Informatika' },
      location: { label: 'Kota', placeholder: 'Malang' },
      range: { label: 'Periode' },
      extra: { label: 'Predikat (opsional)', placeholder: 'Cum Laude, lulusan terbaik' },
      details: { label: 'Keterangan', placeholder: 'Skripsi: Sistem rekomendasi …\nAsisten praktikum Basis Data' },
    },
  },
  organization: {
    type: 'organization',
    name: { id: 'Pengalaman Organisasi', en: 'Organizational Experience' },
    hint: 'BEM, himpunan, UKM, OSIS, karang taruna, komunitas.',
    kind: 'entries',
    addLabel: 'Tambah organisasi',
    fields: {
      title: { label: 'Jabatan', placeholder: 'Ketua Divisi Humas' },
      subtitle: { label: 'Organisasi', placeholder: 'BEM Fakultas Ekonomi' },
      location: { label: 'Kota' },
      range: { label: 'Periode' },
      details: { label: 'Kegiatan & hasil', placeholder: 'Memimpin 12 anggota, menjalin kerja sama dengan 8 sponsor' },
    },
  },
  committee: {
    type: 'committee',
    name: { id: 'Kepanitiaan', en: 'Committee Experience' },
    hint: 'Panitia acara kampus, lomba, seminar, ospek.',
    kind: 'entries',
    addLabel: 'Tambah kepanitiaan',
    fields: {
      title: { label: 'Peran', placeholder: 'Koordinator Acara' },
      subtitle: { label: 'Nama kegiatan', placeholder: 'Seminar Nasional Kewirausahaan 2024' },
      range: { label: 'Waktu' },
      details: { label: 'Keterangan', placeholder: 'Acara dihadiri 500 peserta' },
    },
  },
  volunteer: {
    type: 'volunteer',
    name: { id: 'Relawan & Pengabdian', en: 'Volunteering' },
    hint: 'KKN, relawan bencana, mengajar, kegiatan sosial.',
    kind: 'entries',
    addLabel: 'Tambah kegiatan',
    fields: {
      title: { label: 'Peran', placeholder: 'Relawan Pengajar' },
      subtitle: { label: 'Organisasi / program', placeholder: 'KKN Desa Sumberejo' },
      location: { label: 'Lokasi' },
      range: { label: 'Periode' },
      details: { label: 'Keterangan' },
    },
  },
  projects: {
    type: 'projects',
    name: { id: 'Proyek', en: 'Projects' },
    hint: 'Proyek kuliah, freelance, atau portofolio pribadi.',
    kind: 'entries',
    addLabel: 'Tambah proyek',
    fields: {
      title: { label: 'Nama proyek', placeholder: 'Aplikasi Kasir UMKM' },
      subtitle: { label: 'Peran / teknologi', placeholder: 'Flutter, Firebase' },
      range: { label: 'Periode' },
      link: { label: 'Tautan', placeholder: 'github.com/nama/proyek' },
      details: { label: 'Keterangan', placeholder: 'Dipakai 3 toko di Malang' },
    },
  },
  skills: {
    type: 'skills',
    name: { id: 'Keahlian', en: 'Skills' },
    hint: 'Tulis keahlian yang relevan dengan lowongan. Kelompokkan bila banyak.',
    kind: 'list',
    side: true,
    addLabel: 'Tambah keahlian',
    fields: {
      title: { label: 'Keahlian', placeholder: 'Microsoft Excel' },
      subtitle: { label: 'Kelompok (opsional)', placeholder: 'Software' },
      level: { label: 'Tingkat' },
    },
  },
  languages: {
    type: 'languages',
    name: { id: 'Bahasa', en: 'Languages' },
    hint: 'Sertakan skor tes bila ada (TOEFL, IELTS, JLPT, TOPIK).',
    kind: 'list',
    side: true,
    addLabel: 'Tambah bahasa',
    fields: {
      title: { label: 'Bahasa', placeholder: 'Bahasa Inggris' },
      subtitle: { label: 'Kemampuan', placeholder: 'Aktif / Fluent / B2' },
      extra: { label: 'Skor tes', placeholder: 'TOEFL ITP 550' },
      level: { label: 'Tingkat' },
    },
  },
  certifications: {
    type: 'certifications',
    name: { id: 'Sertifikasi', en: 'Certifications' },
    hint: 'Sertifikat kompetensi (BNSP), profesi, atau kursus resmi.',
    kind: 'entries',
    singleDate: true,
    addLabel: 'Tambah sertifikat',
    fields: {
      title: { label: 'Nama sertifikat', placeholder: 'Sertifikat Kompetensi Junior Web Developer' },
      subtitle: { label: 'Penerbit', placeholder: 'BNSP' },
      range: { label: 'Tanggal terbit' },
      extra: { label: 'Nomor / ID kredensial' },
      link: { label: 'Tautan verifikasi' },
    },
  },
  training: {
    type: 'training',
    name: { id: 'Pelatihan & Kursus', en: 'Training & Courses' },
    hint: 'Pelatihan kerja, bootcamp, kursus online.',
    kind: 'entries',
    singleDate: true,
    addLabel: 'Tambah pelatihan',
    fields: {
      title: { label: 'Nama pelatihan', placeholder: 'Google Data Analytics' },
      subtitle: { label: 'Penyelenggara', placeholder: 'Coursera' },
      range: { label: 'Waktu' },
      details: { label: 'Keterangan' },
    },
  },
  awards: {
    type: 'awards',
    name: { id: 'Prestasi & Penghargaan', en: 'Awards & Achievements' },
    hint: 'Juara lomba, beasiswa, penghargaan kerja.',
    kind: 'entries',
    singleDate: true,
    addLabel: 'Tambah prestasi',
    fields: {
      title: { label: 'Prestasi', placeholder: 'Juara 2 Lomba Business Plan Nasional' },
      subtitle: { label: 'Penyelenggara', placeholder: 'Kemendikbudristek' },
      range: { label: 'Tahun' },
      details: { label: 'Keterangan' },
    },
  },
  publications: {
    type: 'publications',
    name: { id: 'Publikasi', en: 'Publications' },
    hint: 'Jurnal, prosiding, artikel, buku.',
    kind: 'entries',
    singleDate: true,
    addLabel: 'Tambah publikasi',
    fields: {
      title: { label: 'Judul', placeholder: 'Analisis Sentimen Ulasan Aplikasi …' },
      subtitle: { label: 'Jurnal / penerbit', placeholder: 'Jurnal Teknologi Informasi, Vol. 5' },
      range: { label: 'Tahun' },
      link: { label: 'Tautan / DOI' },
      details: { label: 'Penulis / keterangan' },
    },
  },
  hobbies: {
    type: 'hobbies',
    name: { id: 'Minat & Hobi', en: 'Interests' },
    hint: 'Opsional. Pilih yang menunjukkan karakter atau relevan dengan pekerjaan.',
    kind: 'list',
    side: true,
    addLabel: 'Tambah minat',
    fields: { title: { label: 'Minat', placeholder: 'Fotografi' } },
  },
  references: {
    type: 'references',
    name: { id: 'Referensi', en: 'References' },
    hint: 'Minta izin dulu sebelum mencantumkan kontak seseorang.',
    kind: 'entries',
    addLabel: 'Tambah referensi',
    fields: {
      title: { label: 'Nama', placeholder: 'Dr. Siti Rahma, M.M.' },
      subtitle: { label: 'Jabatan & instansi', placeholder: 'Kepala Program Studi, Universitas Negeri Malang' },
      extra: { label: 'Kontak', placeholder: '0812-xxxx-xxxx · siti@um.ac.id' },
    },
  },
  custom: {
    type: 'custom',
    name: { id: 'Bagian Lain', en: 'Other' },
    hint: 'Bagian bebas, beri judul sendiri.',
    kind: 'entries',
    addLabel: 'Tambah isi',
    fields: {
      title: { label: 'Judul' },
      subtitle: { label: 'Subjudul' },
      location: { label: 'Lokasi' },
      range: { label: 'Periode' },
      details: { label: 'Keterangan' },
    },
  },
};

export const SECTION_ORDER: SectionType[] = [
  'summary',
  'experience',
  'internship',
  'education',
  'organization',
  'committee',
  'projects',
  'skills',
  'languages',
  'certifications',
  'training',
  'awards',
  'volunteer',
  'publications',
  'hobbies',
  'references',
  'custom',
];

export const LEVEL_NAMES: Record<Lang, string[]> = {
  id: ['', 'Dasar', 'Cukup', 'Menengah', 'Mahir', 'Ahli'],
  en: ['', 'Basic', 'Fair', 'Intermediate', 'Advanced', 'Expert'],
};

export const LANGUAGE_LEVELS: Record<Lang, string[]> = {
  id: ['', 'Dasar', 'Pasif', 'Menengah', 'Aktif', 'Bahasa ibu'],
  en: ['', 'Elementary', 'Limited working', 'Professional working', 'Fluent', 'Native'],
};

export function sectionTitle(type: SectionType, lang: Lang, override?: string): string {
  return override?.trim() || SECTION_DEFS[type].name[lang];
}
