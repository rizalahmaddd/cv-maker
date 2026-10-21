import type { Lang, PersonalFlag } from '../types';

export interface DocLabels {
  personalData: string;
  contact: string;
  name: string;
  birth: string;
  gender: string;
  religion: string;
  marital: string;
  nationality: string;
  body: string;
  license: string;
  address: string;
  email: string;
  phone: string;
  location: string;
  height: string;
  weight: string;
  page: string;
  of: string;
  links: string;
  curriculumVitae: string;
}

const LABELS: Record<Lang, DocLabels> = {
  id: {
    personalData: 'Data Diri',
    contact: 'Kontak',
    name: 'Nama',
    birth: 'Tempat, tanggal lahir',
    gender: 'Jenis kelamin',
    religion: 'Agama',
    marital: 'Status',
    nationality: 'Kewarganegaraan',
    body: 'Tinggi / berat badan',
    license: 'SIM',
    address: 'Alamat',
    email: 'Email',
    phone: 'Telepon',
    location: 'Domisili',
    height: 'cm',
    weight: 'kg',
    page: 'Halaman',
    of: 'dari',
    links: 'Tautan',
    curriculumVitae: 'Daftar Riwayat Hidup',
  },
  en: {
    personalData: 'Personal Details',
    contact: 'Contact',
    name: 'Name',
    birth: 'Date of birth',
    gender: 'Gender',
    religion: 'Religion',
    marital: 'Marital status',
    nationality: 'Nationality',
    body: 'Height / weight',
    license: "Driver's license",
    address: 'Address',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    height: 'cm',
    weight: 'kg',
    page: 'Page',
    of: 'of',
    links: 'Links',
    curriculumVitae: 'Curriculum Vitae',
  },
};

export function docLabels(lang: Lang): DocLabels {
  return LABELS[lang];
}

export const PERSONAL_FLAG_NAMES: Record<PersonalFlag, string> = {
  birth: 'Tempat & tanggal lahir',
  gender: 'Jenis kelamin',
  religion: 'Agama',
  marital: 'Status pernikahan',
  nationality: 'Kewarganegaraan',
  body: 'Tinggi & berat badan',
  license: 'SIM',
  address: 'Alamat lengkap',
};
