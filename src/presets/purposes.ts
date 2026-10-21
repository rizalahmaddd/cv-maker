import type { SectionType } from '../types';

export type PurposeKey = 'fresh' | 'student' | 'experienced' | 'abroad';

export const PURPOSES: { key: PurposeKey; name: string; hint: string; sections: SectionType[] }[] = [
  {
    key: 'fresh',
    name: 'Fresh graduate',
    hint: 'Baru lulus, pengalaman dari magang & organisasi',
    sections: ['summary', 'education', 'internship', 'organization', 'experience', 'skills', 'languages', 'certifications', 'awards'],
  },
  {
    key: 'student',
    name: 'Mahasiswa / pelajar',
    hint: 'Untuk magang, PKL, beasiswa, atau organisasi',
    sections: ['summary', 'education', 'organization', 'committee', 'projects', 'skills', 'languages', 'awards'],
  },
  {
    key: 'experienced',
    name: 'Sudah berpengalaman',
    hint: 'Pindah kerja atau naik jabatan',
    sections: ['summary', 'experience', 'education', 'skills', 'certifications', 'languages', 'training'],
  },
  {
    key: 'abroad',
    name: 'Kerja di luar negeri',
    hint: 'Jepang, Korea, Timur Tengah, Eropa, dan lainnya',
    sections: ['summary', 'experience', 'education', 'skills', 'languages', 'certifications', 'training'],
  },
];
