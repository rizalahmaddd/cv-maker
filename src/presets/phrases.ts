import type { Lang } from '../types';

export interface JobFamily {
  key: string;
  name: string;
  summary: Record<Lang, string[]>;
  bullets: Record<Lang, string[]>;
  skills: string[];
}

// Bracketed parts are meant to be replaced; every line is a starting point, not a finished claim.
export const FAMILIES: JobFamily[] = [
  {
    key: 'admin',
    name: 'Administrasi & perkantoran',
    summary: {
      id: [
        'Staf administrasi dengan pengalaman [2] tahun mengelola dokumen, data, dan jadwal kantor. Teliti, terbiasa dengan Microsoft Office, dan mampu bekerja dengan tenggat waktu ketat.',
        'Lulusan [jurusan] yang rapi dan teliti, terbiasa mengolah data dengan Excel serta menyusun laporan. Siap mendukung kelancaran operasional kantor sebagai staf administrasi.',
      ],
      en: [
        'Administrative staff with [2] years of experience managing documents, data and office schedules. Detail-oriented, proficient in Microsoft Office and comfortable with tight deadlines.',
        '[Major] graduate with strong organisational skills, experienced in Excel data processing and report writing, ready to support smooth office operations.',
      ],
    },
    bullets: {
      id: [
        'Mengelola arsip [500+] dokumen fisik dan digital dengan sistem penamaan yang konsisten',
        'Menyusun laporan [mingguan] untuk [manajer cabang] menggunakan Excel (pivot, VLOOKUP)',
        'Menginput dan memverifikasi [200] data transaksi per hari tanpa selisih',
        'Mengatur jadwal rapat dan perjalanan dinas untuk [8] orang pimpinan',
        'Menyiapkan surat-menyurat, notulen, dan dokumen tender',
      ],
      en: [
        'Maintained [500+] physical and digital records with a consistent filing system',
        'Prepared [weekly] reports for [branch managers] using Excel (pivot tables, VLOOKUP)',
        'Entered and verified [200] transactions daily with zero discrepancies',
        'Coordinated meetings and business travel for [8] executives',
        'Drafted correspondence, minutes and tender documents',
      ],
    },
    skills: ['Microsoft Excel', 'Microsoft Word', 'Google Workspace', 'Pengarsipan', 'Data entry', 'Korespondensi', 'Ketelitian', 'Manajemen waktu'],
  },
  {
    key: 'sales',
    name: 'Sales & pemasaran',
    summary: {
      id: [
        'Sales dengan pengalaman [3] tahun di bidang [FMCG], terbiasa mencapai target dan membangun hubungan baik dengan pelanggan. Konsisten melampaui target penjualan hingga [120]%.',
        'Fresh graduate [Manajemen Pemasaran] dengan pengalaman magang di bidang digital marketing. Kreatif membuat konten, memahami data kampanye, dan senang berinteraksi dengan pelanggan.',
      ],
      en: [
        'Sales professional with [3] years in [FMCG], focused on hitting targets and building long-term customer relationships. Consistently exceeded sales targets by up to [20]%.',
        '[Marketing] graduate with a digital marketing internship, creative in producing content and comfortable reading campaign data.',
      ],
    },
    bullets: {
      id: [
        'Mencapai [115]% target penjualan kuartalan di area [Jawa Timur]',
        'Menambah [40] pelanggan baru melalui kunjungan dan presentasi produk',
        'Mengelola akun media sosial; pengikut naik [35]% dalam [6] bulan',
        'Menjalankan iklan Meta Ads dengan ROAS [4]x dan anggaran Rp[10] juta/bulan',
        'Menyusun laporan penjualan dan analisis kompetitor setiap bulan',
      ],
      en: [
        'Achieved [115]% of quarterly sales target in the [East Java] territory',
        'Acquired [40] new accounts through visits and product presentations',
        'Grew social media following by [35]% in [6] months',
        'Ran Meta Ads campaigns at [4]x ROAS on a [USD 700]/month budget',
        'Produced monthly sales reports and competitor analysis',
      ],
    },
    skills: ['Negosiasi', 'Digital Marketing', 'Meta Ads', 'Google Ads', 'Copywriting', 'Canva', 'CRM', 'Public speaking', 'Analisis pasar'],
  },
  {
    key: 'finance',
    name: 'Keuangan & akuntansi',
    summary: {
      id: [
        'Lulusan Akuntansi dengan IPK [3,6] dan pengalaman magang di bagian keuangan. Menguasai jurnal, rekonsiliasi bank, dan aplikasi [Accurate], serta memahami dasar perpajakan.',
        'Staf akuntansi berpengalaman [3] tahun menyusun laporan keuangan bulanan, mengelola hutang-piutang, dan menyiapkan dokumen pajak.',
      ],
      en: [
        'Accounting graduate (GPA [3.6]) with a finance internship, skilled in journal entries, bank reconciliation and [accounting software], with a working knowledge of Indonesian tax.',
        'Accounting staff with [3] years of experience preparing monthly financial statements, managing payables/receivables and tax filings.',
      ],
    },
    bullets: {
      id: [
        'Menyusun laporan keuangan bulanan [2] hari lebih cepat dari jadwal',
        'Melakukan rekonsiliasi [5] rekening bank setiap bulan tanpa selisih',
        'Mengelola hutang-piutang [150] vendor dan pelanggan',
        'Menyiapkan bukti potong dan pelaporan PPh 21/23 serta PPN',
        'Membantu audit eksternal dengan menyiapkan dokumen pendukung',
      ],
      en: [
        'Closed monthly financial statements [2] days ahead of schedule',
        'Reconciled [5] bank accounts monthly with no discrepancies',
        'Managed payables and receivables for [150] vendors and customers',
        'Prepared withholding tax slips and VAT filings',
        'Supported external audits by preparing supporting documents',
      ],
    },
    skills: ['Akuntansi', 'Accurate', 'Jurnal.id', 'SAP', 'Excel lanjutan', 'Perpajakan (Brevet A&B)', 'Rekonsiliasi bank', 'Laporan keuangan'],
  },
  {
    key: 'it',
    name: 'IT & software',
    summary: {
      id: [
        'Software developer dengan pengalaman [2] tahun membangun aplikasi web menggunakan [React dan Node.js]. Terbiasa bekerja dalam tim Agile dan menulis kode yang mudah dirawat.',
        'Lulusan [Teknik Informatika] dengan portofolio [3] proyek aplikasi. Cepat belajar teknologi baru dan tertarik pada pengembangan [backend].',
      ],
      en: [
        'Software developer with [2] years of experience building web apps with [React and Node.js], used to Agile teams and maintainable code.',
        '[Computer Science] graduate with a portfolio of [3] shipped projects, a fast learner with a strong interest in [backend] development.',
      ],
    },
    bullets: {
      id: [
        'Membangun fitur [pembayaran] yang dipakai [10.000] pengguna per bulan',
        'Mempercepat waktu muat halaman dari [4] menjadi [1,5] detik',
        'Menulis unit test hingga cakupan kode [80]%',
        'Membuat REST API untuk aplikasi mobile dengan [Laravel/Node.js]',
        'Memperbaiki [30+] bug kritis dan menurunkan keluhan pengguna',
      ],
      en: [
        'Built a [payments] feature used by [10,000] monthly users',
        'Cut page load time from [4]s to [1.5]s',
        'Raised unit test coverage to [80]%',
        'Developed REST APIs for a mobile app with [Laravel/Node.js]',
        'Fixed [30+] critical bugs, reducing user complaints',
      ],
    },
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Laravel', 'Flutter', 'SQL', 'Git', 'REST API', 'Docker', 'Python'],
  },
  {
    key: 'design',
    name: 'Desain & kreatif',
    summary: {
      id: ['Desainer grafis dengan pengalaman [2] tahun membuat materi promosi digital dan cetak. Menguasai Adobe Illustrator, Photoshop, dan Figma, serta terbiasa bekerja dengan brief yang ketat.'],
      en: ['Graphic designer with [2] years of experience producing digital and print campaigns. Proficient in Adobe Illustrator, Photoshop and Figma, comfortable working to tight briefs.'],
    },
    bullets: {
      id: [
        'Mendesain [200+] konten media sosial untuk [5] brand klien',
        'Membuat ulang identitas visual [brand], meningkatkan engagement [25]%',
        'Merancang UI aplikasi [kasir] di Figma bersama tim developer',
        'Mengedit video pendek untuk Reels/TikTok dengan rata-rata [50 ribu] tayangan',
      ],
      en: [
        'Designed [200+] social media assets for [5] client brands',
        'Redesigned the [brand] visual identity, lifting engagement by [25]%',
        'Designed the [POS] app UI in Figma with the developer team',
        'Edited short-form videos averaging [50k] views',
      ],
    },
    skills: ['Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Canva', 'Adobe Premiere', 'CapCut', 'Tipografi', 'Branding', 'UI/UX'],
  },
  {
    key: 'cs',
    name: 'Customer service',
    summary: {
      id: ['Customer service dengan pengalaman [2] tahun menangani pelanggan melalui telepon, chat, dan email. Sabar, komunikatif, dan terbiasa mencapai target kepuasan pelanggan.'],
      en: ['Customer service representative with [2] years handling customers by phone, chat and email. Patient, articulate and used to meeting satisfaction targets.'],
    },
    bullets: {
      id: [
        'Menangani [80] percakapan pelanggan per hari dengan skor kepuasan [4,8]/5',
        'Menyelesaikan [90]% keluhan pada kontak pertama',
        'Menyusun FAQ yang menurunkan pertanyaan berulang hingga [30]%',
        'Melatih [5] agen baru tentang produk dan SOP layanan',
      ],
      en: [
        'Handled [80] customer conversations daily with a [4.8]/5 satisfaction score',
        'Resolved [90]% of complaints on first contact',
        'Wrote an FAQ that cut repeat questions by [30]%',
        'Trained [5] new agents on products and service SOPs',
      ],
    },
    skills: ['Komunikasi', 'Pelayanan pelanggan', 'Penanganan keluhan', 'CRM', 'Zendesk', 'Bahasa Inggris', 'Mengetik cepat', 'Empati'],
  },
  {
    key: 'logistics',
    name: 'Gudang & logistik',
    summary: {
      id: ['Staf gudang berpengalaman [3] tahun dalam penerimaan barang, stock opname, dan pengiriman. Teliti, disiplin, dan terbiasa memakai sistem inventori serta forklift.'],
      en: ['Warehouse staff with [3] years in receiving, stock counts and dispatch. Accurate, disciplined and experienced with inventory systems and forklifts.'],
    },
    bullets: {
      id: [
        'Mengelola stok [1.500] SKU dengan akurasi [99]% pada stock opname',
        'Menyiapkan [300] pengiriman per hari tepat waktu',
        'Menurunkan barang rusak/hilang sebesar [20]% dengan penataan ulang rak',
        'Membuat surat jalan dan laporan stok harian',
      ],
      en: [
        'Managed [1,500] SKUs with [99]% stock count accuracy',
        'Prepared [300] daily shipments on time',
        'Reduced damaged/lost goods by [20]% by reorganising racking',
        'Issued delivery notes and daily stock reports',
      ],
    },
    skills: ['Stock opname', 'Inventory', 'Forklift (SIO)', 'Surat jalan', 'FIFO/FEFO', 'Excel', 'K3', 'Ketelitian'],
  },
  {
    key: 'production',
    name: 'Produksi & manufaktur',
    summary: {
      id: ['Operator produksi lulusan SMK [Teknik Mesin] dengan pengalaman [2] tahun di pabrik [otomotif]. Memahami K3, 5S, dan mampu bekerja dalam sistem shift.'],
      en: ['Production operator with a vocational [mechanical engineering] background and [2] years in [automotive] manufacturing. Familiar with OHS, 5S and shift work.'],
    },
    bullets: {
      id: [
        'Mengoperasikan mesin [CNC] dengan tingkat cacat di bawah [1]%',
        'Mencapai target output [500] unit per shift',
        'Menerapkan 5S di area kerja dan lolos audit internal',
        'Melakukan perawatan mesin harian sesuai checklist',
      ],
      en: [
        'Operated [CNC] machines with a defect rate below [1]%',
        'Met an output target of [500] units per shift',
        'Applied 5S in the work area and passed internal audits',
        'Performed daily machine maintenance per checklist',
      ],
    },
    skills: ['K3', '5S', 'Quality control', 'Mesin CNC', 'Membaca gambar teknik', 'Kerja shift', 'Kaizen'],
  },
  {
    key: 'hospitality',
    name: 'Hotel, restoran & pariwisata',
    summary: {
      id: ['Staf hospitality dengan pengalaman [2] tahun di [hotel bintang 4]. Ramah, rapi, dan terbiasa melayani tamu domestik maupun mancanegara.'],
      en: ['Hospitality staff with [2] years at a [4-star hotel]. Friendly, well-presented and experienced serving local and international guests.'],
    },
    bullets: {
      id: [
        'Melayani [100+] tamu per hari di bagian [front office]',
        'Mendapat ulasan positif tamu yang menyebut nama di [TripAdvisor]',
        'Menangani check-in/check-out dan reservasi di sistem [Opera PMS]',
        'Menyiapkan [200] porsi per shift sesuai standar resep dan higienitas',
      ],
      en: [
        'Served [100+] guests daily at the [front office]',
        'Named in positive guest reviews on [TripAdvisor]',
        'Handled check-ins, check-outs and reservations in [Opera PMS]',
        'Prepared [200] covers per shift to recipe and hygiene standards',
      ],
    },
    skills: ['Pelayanan tamu', 'Bahasa Inggris', 'Opera PMS', 'Food safety', 'Barista', 'Housekeeping', 'Grooming'],
  },
  {
    key: 'education',
    name: 'Pendidikan / guru',
    summary: {
      id: ['Guru [Matematika] dengan pengalaman mengajar [3] tahun di tingkat [SMP]. Kreatif menyusun pembelajaran interaktif dan terbiasa memakai teknologi di kelas.'],
      en: ['[Mathematics] teacher with [3] years of [junior high] experience, creating interactive lessons and using technology in the classroom.'],
    },
    bullets: {
      id: [
        'Mengajar [6] kelas dengan total [180] siswa',
        'Meningkatkan rata-rata nilai ujian kelas sebesar [15] poin',
        'Menyusun modul ajar Kurikulum Merdeka untuk [2] mata pelajaran',
        'Membimbing siswa meraih juara [olimpiade sains] tingkat kota',
      ],
      en: [
        'Taught [6] classes of [180] students in total',
        'Raised average class exam scores by [15] points',
        'Wrote curriculum modules for [2] subjects',
        'Coached students to a city-level [science olympiad] win',
      ],
    },
    skills: ['Penyusunan RPP', 'Kurikulum Merdeka', 'Manajemen kelas', 'Google Classroom', 'Public speaking', 'Bimbingan siswa'],
  },
  {
    key: 'health',
    name: 'Kesehatan & perawat',
    summary: {
      id: ['Perawat dengan STR aktif dan pengalaman [2] tahun di [ruang rawat inap]. Teliti, empatik, dan terbiasa bekerja dalam tim medis multidisiplin.'],
      en: ['Registered nurse with [2] years in [inpatient care]. Careful, empathetic and experienced in multidisciplinary medical teams.'],
    },
    bullets: {
      id: [
        'Merawat rata-rata [12] pasien per shift sesuai standar asuhan keperawatan',
        'Melakukan pemantauan tanda vital dan dokumentasi rekam medis elektronik',
        'Memberikan edukasi kesehatan kepada pasien dan keluarga',
        'Bertugas dalam tim tanggap darurat (BLS/BTCLS)',
      ],
      en: [
        'Cared for an average of [12] patients per shift to nursing standards',
        'Monitored vital signs and maintained electronic medical records',
        'Delivered health education to patients and families',
        'Served on the emergency response team (BLS certified)',
      ],
    },
    skills: ['Asuhan keperawatan', 'BTCLS', 'BLS', 'Rekam medis elektronik', 'Pengendalian infeksi', 'Empati'],
  },
  {
    key: 'caregiver',
    name: 'Caregiver / kaigo (luar negeri)',
    summary: {
      id: ['Caregiver lulusan pelatihan [kaigo] dengan sertifikat [JLPT N4]. Sabar, bertanggung jawab, dan siap merawat lansia di [Jepang].'],
      en: ['Trained caregiver ([kaigo]) holding [JLPT N4], patient and responsible, ready to care for the elderly in [Japan].'],
    },
    bullets: {
      id: [
        'Membantu kebutuhan harian [6] lansia: makan, mandi, dan mobilitas',
        'Mencatat kondisi kesehatan harian dan melaporkan kepada perawat',
        'Menyelesaikan pelatihan kaigo [300] jam dan praktik di panti',
      ],
      en: [
        'Assisted [6] elderly residents with meals, bathing and mobility',
        'Logged daily health conditions and reported to nurses',
        'Completed [300] hours of kaigo training and nursing-home practice',
      ],
    },
    skills: ['Perawatan lansia', 'Bahasa Jepang (JLPT N4)', 'Pertolongan pertama', 'Kebersihan & sanitasi', 'Kesabaran'],
  },
  {
    key: 'hr',
    name: 'HR & rekrutmen',
    summary: {
      id: ['Staf HR dengan pengalaman [2] tahun di rekrutmen dan administrasi karyawan. Memahami proses end-to-end dari sourcing hingga onboarding serta peraturan ketenagakerjaan.'],
      en: ['HR staff with [2] years in recruitment and employee administration, covering end-to-end hiring from sourcing to onboarding.'],
    },
    bullets: {
      id: [
        'Merekrut [60] karyawan dalam [6] bulan dengan rata-rata waktu rekrut [21] hari',
        'Mengelola absensi dan penggajian [200] karyawan',
        'Menyelenggarakan program onboarding dan pelatihan karyawan baru',
        'Mengurus administrasi BPJS Ketenagakerjaan dan Kesehatan',
      ],
      en: [
        'Hired [60] employees in [6] months with a [21]-day average time-to-hire',
        'Managed attendance and payroll for [200] employees',
        'Ran onboarding and new-hire training programmes',
        'Handled national social security (BPJS) administration',
      ],
    },
    skills: ['Rekrutmen', 'Interviewing', 'Payroll', 'BPJS', 'HRIS', 'UU Ketenagakerjaan', 'Excel'],
  },
];

export const ACTION_VERBS: Record<Lang, string[]> = {
  id: [
    'Mengelola',
    'Memimpin',
    'Menyusun',
    'Mengembangkan',
    'Meningkatkan',
    'Menurunkan',
    'Membangun',
    'Merancang',
    'Mengkoordinasikan',
    'Menganalisis',
    'Melatih',
    'Menyelesaikan',
    'Mencapai',
    'Mengoptimalkan',
    'Menjalin',
    'Menangani',
  ],
  en: ['Managed', 'Led', 'Built', 'Designed', 'Developed', 'Improved', 'Reduced', 'Increased', 'Coordinated', 'Analysed', 'Trained', 'Delivered', 'Achieved', 'Optimised', 'Negotiated', 'Resolved'],
};
