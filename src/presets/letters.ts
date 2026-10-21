import type { Lang } from '../types';

export interface LetterPreset {
  key: string;
  name: string;
  body: Record<Lang, string>;
}

// [lampiran] marks where the attachment list is printed; {..} fields are filled from the linked CV.
export const LETTER_PRESETS: LetterPreset[] = [
  {
    key: 'fresh',
    name: 'Fresh graduate',
    body: {
      id: `Berdasarkan informasi lowongan yang saya peroleh dari {sumber}, saya bermaksud melamar posisi {posisi} di {perusahaan}. Saya adalah lulusan {pendidikan} yang memiliki minat besar untuk berkembang di bidang ini.

Selama kuliah, saya aktif mengikuti organisasi dan magang sehingga terbiasa bekerja dalam tim, berkomunikasi dengan baik, dan menyelesaikan tugas tepat waktu. Saya juga menguasai {keahlian} yang saya yakini dapat menunjang pekerjaan pada posisi tersebut.

Sebagai bahan pertimbangan, saya lampirkan:
[lampiran]

Saya berharap dapat diberi kesempatan wawancara untuk menjelaskan lebih lanjut mengenai kemampuan saya. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.`,
      en: `I am writing to apply for the {posisi} position at {perusahaan}, which I found through {sumber}. As a recent {pendidikan} graduate, I am eager to start my career in this field.

During my studies I took part in student organisations and an internship, where I learned to work in a team, communicate clearly and deliver on time. I am also skilled in {keahlian}, which I believe will help me contribute from day one.

Please find enclosed:
[lampiran]

I would welcome the opportunity to discuss how I can contribute to your team. Thank you for your time and consideration.`,
    },
  },
  {
    key: 'experienced',
    name: 'Sudah berpengalaman',
    body: {
      id: `Melalui surat ini saya mengajukan lamaran untuk posisi {posisi} di {perusahaan} sesuai informasi dari {sumber}.

Saat ini saya bekerja sebagai {jabatan} dengan pengalaman di bidang yang relevan. Dalam peran tersebut saya terbiasa menangani tanggung jawab yang sejalan dengan kebutuhan posisi ini dan menguasai {keahlian}. Saya percaya pengalaman tersebut dapat memberi kontribusi nyata bagi {perusahaan}.

Bersama surat ini saya lampirkan:
[lampiran]

Besar harapan saya untuk dapat mengikuti proses seleksi selanjutnya. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.`,
      en: `I would like to apply for the {posisi} role at {perusahaan}, as advertised on {sumber}.

I currently work as {jabatan} and have hands-on experience in responsibilities closely matching this role. I am proficient in {keahlian} and confident that my experience will let me make a meaningful contribution to {perusahaan}.

Please find enclosed:
[lampiran]

I look forward to the opportunity to discuss my application further. Thank you for your consideration.`,
    },
  },
  {
    key: 'internship',
    name: 'Magang / PKL',
    body: {
      id: `Saya, mahasiswa {pendidikan}, bermaksud mengajukan permohonan magang di {perusahaan} pada bagian {posisi}. Kegiatan magang ini merupakan bagian dari program studi saya dan saya berharap dapat belajar langsung dari para profesional di {perusahaan}.

Saya memiliki kemampuan {keahlian} serta terbiasa bekerja sama dalam tim melalui kegiatan organisasi di kampus. Saya siap mengikuti seluruh ketentuan yang berlaku selama masa magang.

Sebagai bahan pertimbangan, saya lampirkan:
[lampiran]

Demikian surat permohonan ini saya sampaikan. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.`,
      en: `I am a {pendidikan} student and would like to apply for an internship in the {posisi} team at {perusahaan}. This internship is part of my study programme, and I hope to learn directly from your professionals.

I am skilled in {keahlian} and used to working in teams through campus organisations. I am ready to follow all internship requirements.

Please find enclosed:
[lampiran]

Thank you for considering my application. I look forward to hearing from you.`,
    },
  },
  {
    key: 'abroad',
    name: 'Kerja di luar negeri',
    body: {
      id: `Dengan hormat, saya mengajukan lamaran untuk posisi {posisi} di {perusahaan}. Saya siap ditempatkan di luar negeri dan telah mempersiapkan dokumen perjalanan yang diperlukan.

Saya memiliki pengalaman dan kemampuan {keahlian}, terbiasa bekerja dengan disiplin, serta mampu beradaptasi dengan lingkungan dan budaya kerja baru.

Bersama surat ini saya lampirkan:
[lampiran]

Saya berharap dapat mengikuti tahap seleksi berikutnya. Terima kasih atas perhatian Bapak/Ibu.`,
      en: `I am applying for the {posisi} position at {perusahaan}. I am ready to relocate and have prepared the required travel documents.

I bring experience in {keahlian}, a disciplined work ethic and the ability to adapt quickly to new working environments and cultures.

Please find enclosed:
[lampiran]

I would be grateful for the opportunity to proceed to the next stage of selection. Thank you for your consideration.`,
    },
  },
  {
    key: 'open',
    name: 'Lamaran umum (tanpa lowongan)',
    body: {
      id: `Saya bermaksud mengajukan lamaran kerja di {perusahaan} apabila terdapat posisi yang sesuai dengan latar belakang saya, khususnya di bidang {posisi}.

Saya memiliki latar belakang {pendidikan} dan kemampuan {keahlian}. Saya merupakan pribadi yang mau belajar, bertanggung jawab, dan mampu bekerja dalam tim.

Sebagai bahan pertimbangan, saya lampirkan:
[lampiran]

Saya berharap Bapak/Ibu berkenan mempertimbangkan lamaran ini. Atas perhatiannya, saya ucapkan terima kasih.`,
      en: `I am writing to express my interest in joining {perusahaan}, particularly in a {posisi} role should a suitable opening be available.

I have a {pendidikan} background and skills in {keahlian}. I am a fast learner, responsible and comfortable working in teams.

Please find enclosed:
[lampiran]

Thank you for considering my application. I hope to hear from you.`,
    },
  },
];

export const DEFAULT_ATTACHMENTS: Record<Lang, string[]> = {
  id: ['Daftar riwayat hidup (CV)', 'Pas foto terbaru ukuran 3×4', 'Fotokopi KTP', 'Fotokopi ijazah dan transkrip nilai', 'Fotokopi sertifikat pendukung'],
  en: ['Curriculum vitae', 'Copy of degree certificate and transcript', 'Supporting certificates'],
};

export const ATTACHMENT_OPTIONS = [
  'Daftar riwayat hidup (CV)',
  'Pas foto terbaru ukuran 3×4',
  'Pas foto terbaru ukuran 4×6',
  'Fotokopi KTP',
  'Fotokopi ijazah dan transkrip nilai',
  'Fotokopi sertifikat pendukung',
  'Fotokopi sertifikat bahasa (TOEFL/IELTS)',
  'Surat Keterangan Catatan Kepolisian (SKCK)',
  'Surat keterangan sehat',
  'Surat keterangan pengalaman kerja',
  'Fotokopi Kartu Keluarga',
  'Fotokopi NPWP',
  'Fotokopi SIM',
  'Kartu AK/1 (kartu kuning)',
  'Fotokopi paspor',
  'Portofolio',
];

export const SOURCES = ['situs resmi perusahaan', 'LinkedIn', 'JobStreet', 'Glints', 'Kalibrr', 'Instagram', 'bursa kerja kampus', 'rekomendasi kenalan'];

export const SALUTATION: Record<Lang, string> = { id: 'Dengan hormat,', en: 'Dear Hiring Manager,' };
export const CLOSING: Record<Lang, string> = { id: 'Hormat saya,', en: 'Sincerely,' };
