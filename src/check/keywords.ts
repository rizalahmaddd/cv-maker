import type { Cv } from '../types';
import { cvToText } from '../export/text';

const STOP = new Set(
  (
    'a an the and or of to in on for with at by from as is are be been being this that these those it its our your their we you they he she will would can could should must may ' +
    'have has had do does did not no yes if then than so such into over under about above below up down out more most other some any each all both few many much very also ' +
    'job role position candidate candidates applicant team company work working experience years year required requirements preferred plus strong good excellent ability able skills skill knowledge ' +
    'responsibilities responsible including include etc using use minimum least degree bachelor relevant related field new well within based across' +
    ' dan atau yang di ke dari untuk dengan pada dalam adalah akan dapat bisa harus wajib serta oleh sebagai juga tidak ini itu kami kamu anda mereka para bagi secara antara ' +
    'tahun minimal maksimal pengalaman kerja bekerja posisi kandidat pelamar perusahaan memiliki mampu kemampuan baik sangat lebih diutamakan bersedia syarat persyaratan kualifikasi tanggung jawab ' +
    'jawab tugas hal sesuai lain lainnya seperti dll min usia pria wanita domisili penempatan lulusan sederajat jurusan semua setiap telah sudah belum masih apa bagaimana'
  ).split(/\s+/),
);

const PHRASES = [
  'microsoft excel',
  'microsoft office',
  'microsoft word',
  'power bi',
  'google sheets',
  'google analytics',
  'google ads',
  'meta ads',
  'facebook ads',
  'social media',
  'media sosial',
  'digital marketing',
  'content creator',
  'content writing',
  'copywriting',
  'search engine optimization',
  'customer service',
  'pelayanan pelanggan',
  'data analysis',
  'analisis data',
  'data entry',
  'project management',
  'public speaking',
  'problem solving',
  'time management',
  'machine learning',
  'react native',
  'node js',
  'node.js',
  'rest api',
  'ui/ux',
  'ui ux',
  'adobe photoshop',
  'adobe illustrator',
  'adobe premiere',
  'after effects',
  'autocad',
  'sap',
  'accurate',
  'zahir',
  'jurnal umum',
  'laporan keuangan',
  'perpajakan',
  'brevet',
  'surat jalan',
  'stock opname',
  'purchase order',
  'inventory',
  'forklift',
  'k3',
  'quality control',
  'sales target',
  'b2b',
  'b2c',
  'kerja sama tim',
  'teamwork',
  'leadership',
  'negotiation',
  'negosiasi',
];

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .replace(/\s+/g, ' ');
}

export interface KeywordResult {
  keywords: string[];
  matched: string[];
  missing: string[];
  score: number;
}

// Plain term frequency over the posting, with a short phrase list so "microsoft excel" counts as one skill.
export function matchKeywords(cv: Cv, jobText: string, limit = 24): KeywordResult | null {
  const jd = norm(jobText);
  if (jd.trim().split(' ').length < 8) return null;
  const counts = new Map<string, number>();
  let rest = ` ${jd} `;
  for (const ph of PHRASES) {
    const re = new RegExp(`(^|\\s)${ph.replace(/[.+/]/g, '\\$&')}(?=\\s)`, 'g');
    const n = rest.match(re)?.length ?? 0;
    if (n) {
      counts.set(ph, n + 2);
      rest = rest.replace(re, ' ');
    }
  }
  for (const w of rest.split(' ')) {
    const t = w.replace(/^[-./]+|[-./]+$/g, '');
    if (t.length < 3 && !/^(c#|c\+\+|go|r|ai|k3|qc|hr|it)$/.test(t)) continue;
    if (STOP.has(t) || /^\d+$/.test(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const keywords = [...counts]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([k]) => k);
  const hay = ` ${norm(cvToText(cv))} `;
  const matched = keywords.filter((k) => new RegExp(`\\s${k.replace(/[.+/#]/g, '\\$&')}\\s`).test(hay));
  const missing = keywords.filter((k) => !matched.includes(k));
  return { keywords, matched, missing, score: keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0 };
}
