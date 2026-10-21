export type Lang = 'id' | 'en';
export type ThemePref = 'system' | 'light' | 'dark';

export type CountryKey = 'ID' | 'MY' | 'SG' | 'ME' | 'JP' | 'KR' | 'AU' | 'UK' | 'EU' | 'US' | 'INTL';

// Month is optional because many people only remember the year of an old job or school.
export interface YM {
  y?: number;
  m?: number;
}

export interface DateRange {
  start: YM;
  end: YM;
  current: boolean;
}

export type LinkKind = 'linkedin' | 'github' | 'portfolio' | 'website' | 'instagram' | 'behance' | 'dribbble' | 'youtube' | 'tiktok' | 'other';

export interface CvLink {
  id: string;
  kind: LinkKind;
  url: string;
  label: string;
}

export interface Personal {
  prefix: string;
  fullName: string;
  suffix: string;
  headline: string;
  email: string;
  phone: string;
  city: string;
  region: string;
  country: string;
  address: string;
  links: CvLink[];
  birthPlace: string;
  birthDate: string;
  gender: string;
  religion: string;
  maritalStatus: string;
  nationality: string;
  height: string;
  weight: string;
  drivingLicense: string;
}

export type PersonalFlag = 'birth' | 'gender' | 'religion' | 'marital' | 'nationality' | 'body' | 'license' | 'address';

export type SectionType =
  | 'summary'
  | 'experience'
  | 'internship'
  | 'education'
  | 'organization'
  | 'committee'
  | 'volunteer'
  | 'projects'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'training'
  | 'awards'
  | 'publications'
  | 'hobbies'
  | 'references'
  | 'custom';

// One flexible entry shape for every section; SECTION_DEFS says what each field means per section type.
export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  range: DateRange;
  details: string;
  extra: string;
  link: string;
  level: number;
  degree?: string;
  score?: string;
  scoreMax?: string;
  hidden?: boolean;
}

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  text: string;
  entries: Entry[];
}

export type DateFormat = 'short' | 'long' | 'numeric' | 'year';

export interface CvOptions {
  showPhoto: boolean;
  personal: Record<PersonalFlag, boolean>;
  dateFormat: DateFormat;
  showQr: boolean;
  qrUrl: string;
  fitOnePage: boolean;
}

export interface Cv {
  id: string;
  title: string;
  targetRole: string;
  targetCompany: string;
  country: CountryKey;
  lang: Lang;
  templateId: string;
  personal: Personal;
  photoId?: string;
  sections: Section[];
  options: CvOptions;
  jobDescription: string;
  archived?: boolean;
  rev: number;
  createdAt: number;
  updatedAt: number;
}

export interface Asset {
  id: string;
  kind: 'photo' | 'signature';
  data: string;
  createdAt: number;
}

export interface Letter {
  id: string;
  cvId?: string;
  title: string;
  lang: Lang;
  templateId: string;
  place: string;
  date: string;
  subject: string;
  position: string;
  source: string;
  recipient: string;
  recipientTitle: string;
  company: string;
  companyAddress: string;
  salutation: string;
  body: string;
  closing: string;
  attachments: string[];
  signatureId?: string;
  createdAt: number;
  updatedAt: number;
}

export type AppStatus = 'saved' | 'applied' | 'test' | 'interview' | 'offer' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  company: string;
  position: string;
  url: string;
  location: string;
  status: AppStatus;
  appliedAt: string;
  followUpAt: string;
  cvId?: string;
  letterId?: string;
  salary: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  id: 'app';
  theme: ThemePref;
  defaults: { lang: Lang; country: CountryKey };
  fileNamePattern: string;
  shareMessage: string;
  lastBackupAt?: number;
  onboarded?: boolean;
}

export type LayoutKey = 'klasik' | 'modern' | 'formal' | 'sidebar' | 'garis' | 'kepala' | 'drh' | 'timeline' | 'kreatif' | 'europass' | 'rirekisho';

export type FontKey = 'jakarta' | 'inter' | 'plex' | 'grotesk' | 'poppins' | 'montserrat' | 'outfit' | 'lora' | 'playfair' | 'fraunces' | 'dmserif' | 'mono' | 'spacemono' | 'helvetica' | 'times';

export type PaperKey = 'A4' | 'LETTER' | 'F4' | 'LEGAL';

export type AtsLevel = 'safe' | 'partial' | 'unsafe';

export interface TemplateStyle {
  fontScale: number;
  margin: 'narrow' | 'normal' | 'wide';
  density: 'compact' | 'normal' | 'airy';
  heading: 'line' | 'underline' | 'block' | 'plain' | 'bar';
  headingCase: 'upper' | 'normal';
  photoShape: 'circle' | 'rounded' | 'square';
  skills: 'text' | 'tags' | 'dots' | 'bars';
  icons: boolean;
  headerAlign: 'left' | 'center';
  sideWidth: number;
  datePosition: 'right' | 'below' | 'left';
}

export interface TemplateConfig {
  id: string;
  name: string;
  builtin?: boolean;
  baseId?: string;
  layout: LayoutKey;
  colors: { primary: string; accent: string; text: string; muted: string; paper: string; side: string };
  fonts: { heading: FontKey; body: FontKey };
  style: TemplateStyle;
  paper: PaperKey;
  labels: { id: Partial<Record<SectionType, string>>; en: Partial<Record<SectionType, string>> };
  createdAt?: number;
  updatedAt?: number;
}
