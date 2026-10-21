import Dexie, { type Table } from 'dexie';
import type { Application, Asset, CountryKey, Cv, CvOptions, Entry, Lang, Letter, Personal, Section, SectionType, Settings, TemplateConfig } from './types';
import { BUILTIN_TEMPLATES, DEFAULT_TEMPLATE_ID, normalizeTemplate } from './templates';
import { countryPreset, NO_PERSONAL, optionsForCountry } from './presets/countries';
import { uid } from './lib/id';
import { canonical, digitsOnly, GENDERS, MARITAL, RELIGIONS, splitLegacyEducation } from './presets/personal';

class CvDB extends Dexie {
  cvs!: Table<Cv, string>;
  letters!: Table<Letter, string>;
  assets!: Table<Asset, string>;
  templates!: Table<TemplateConfig, string>;
  applications!: Table<Application, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('cv-maker');
    this.version(1).stores({
      cvs: 'id, title, updatedAt, templateId, country, archived',
      letters: 'id, cvId, updatedAt',
      assets: 'id, kind, createdAt',
      templates: 'id, name, updatedAt',
      applications: 'id, company, status, appliedAt, cvId, updatedAt',
      settings: 'id',
    });
  }
}

export const db = new CvDB();

export const cvChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cv-maker') : null;

export function defaultSettings(): Settings {
  return {
    id: 'app',
    theme: 'system',
    defaults: { lang: 'id', country: 'ID' },
    fileNamePattern: 'CV_{nama}_{posisi}',
    shareMessage: 'Yth. Bapak/Ibu HRD, berikut saya lampirkan CV saya untuk posisi {posisi}. Terima kasih atas perhatiannya. Hormat saya, {nama}.',
  };
}

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get('app');
  const base = defaultSettings();
  if (!stored) return base;
  return { ...base, ...stored, defaults: { ...base.defaults, ...stored.defaults } };
}

export async function updateSettings(patch: Partial<Settings> | ((s: Settings) => Settings)) {
  return db.transaction('rw', db.settings, async () => {
    const current = await getSettings();
    const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
    await db.settings.put(next);
    return next;
  });
}

export async function getTemplate(id: string | undefined): Promise<TemplateConfig> {
  const builtin = BUILTIN_TEMPLATES.find((t) => t.id === id);
  if (builtin) return builtin;
  if (id) {
    const custom = await db.templates.get(id);
    if (custom) return normalizeTemplate(custom);
  }
  return BUILTIN_TEMPLATES[0];
}

export function emptyPersonal(): Personal {
  return {
    prefix: '',
    fullName: '',
    suffix: '',
    headline: '',
    email: '',
    phone: '',
    city: '',
    region: '',
    country: '',
    address: '',
    links: [],
    birthPlace: '',
    birthDate: '',
    gender: '',
    religion: '',
    maritalStatus: '',
    nationality: '',
    height: '',
    weight: '',
    drivingLicense: '',
  };
}

export function emptyEntry(patch: Partial<Entry> = {}): Entry {
  return {
    id: uid(),
    title: '',
    subtitle: '',
    location: '',
    range: { start: {}, end: {}, current: false },
    details: '',
    extra: '',
    link: '',
    level: 0,
    ...patch,
  };
}

export function emptySection(type: SectionType): Section {
  return { id: uid(), type, title: '', visible: true, text: '', entries: [] };
}

export function defaultOptions(country: CountryKey): CvOptions {
  return { ...optionsForCountry(country), dateFormat: 'short', showQr: false, qrUrl: '', fitOnePage: false };
}

const STARTER: SectionType[] = ['summary', 'experience', 'education', 'organization', 'skills', 'languages', 'certifications'];

export function blankCv(country: CountryKey, lang: Lang, templateId: string): Cv {
  const now = Date.now();
  return {
    id: uid(),
    title: '',
    targetRole: '',
    targetCompany: '',
    country,
    lang,
    templateId,
    personal: emptyPersonal(),
    sections: STARTER.map(emptySection),
    options: defaultOptions(country),
    jobDescription: '',
    rev: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizePersonal(p: Personal): Personal {
  return {
    ...p,
    gender: canonical(p.gender, GENDERS),
    religion: canonical(p.religion, RELIGIONS),
    maritalStatus: canonical(p.maritalStatus, MARITAL),
    height: digitsOnly(p.height),
    weight: digitsOnly(p.weight),
  };
}

// CVs saved by an older build are filled with the newest defaults, so new fields never crash old data.
export function normalizeCv(c: Cv): Cv {
  const base = blankCv(c.country ?? 'ID', c.lang ?? 'id', c.templateId ?? DEFAULT_TEMPLATE_ID);
  return {
    ...base,
    ...c,
    personal: normalizePersonal({ ...base.personal, ...c.personal, links: c.personal?.links ?? [] }),
    options: { ...base.options, ...c.options, personal: { ...NO_PERSONAL, ...c.options?.personal } },
    sections: (c.sections ?? base.sections).map((s) => ({
      ...emptySection(s.type),
      ...s,
      entries: (s.entries ?? []).map((e) => {
        const blank = emptyEntry();
        const full = { ...blank, ...e, range: { ...blank.range, ...e.range } };
        return s.type === 'education' ? splitLegacyEducation(full) : full;
      }),
    })),
    rev: c.rev ?? 1,
  };
}

export async function createCv(partial: Partial<Cv> = {}): Promise<Cv> {
  const s = await getSettings();
  const country = partial.country ?? s.defaults.country;
  const preset = countryPreset(country);
  const cv = normalizeCv({
    ...blankCv(country, partial.lang ?? preset.lang, partial.templateId ?? preset.templateId),
    ...partial,
    id: uid(),
    rev: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as Cv);
  await db.cvs.add(cv);
  return cv;
}

export async function duplicateCv(id: string, patch: Partial<Cv> = {}): Promise<Cv | undefined> {
  const src = await db.cvs.get(id);
  if (!src) return undefined;
  const now = Date.now();
  const copy: Cv = {
    ...structuredClone(normalizeCv(src)),
    ...patch,
    id: uid(),
    title: patch.title ?? (src.title ? `${src.title} (salinan)` : ''),
    archived: false,
    rev: 1,
    createdAt: now,
    updatedAt: now,
  };
  copy.sections = copy.sections.map((s) => ({ ...s, id: uid(), entries: s.entries.map((e) => ({ ...e, id: uid() })) }));
  await db.cvs.add(copy);
  return copy;
}

export class StaleWriteError extends Error {}

// Rejects the write when another tab saved a newer revision, instead of silently overwriting it.
export async function saveCv(cv: Cv, baseRev: number): Promise<Cv> {
  return db.transaction('rw', db.cvs, async () => {
    const current = await db.cvs.get(cv.id);
    if (current && current.rev !== baseRev) throw new StaleWriteError('CV ini diubah di tab atau jendela lain.');
    const next = { ...cv, rev: baseRev + 1, updatedAt: Date.now() };
    await db.cvs.put(next);
    return next;
  });
}

// For edits made outside the editor; bumping the revision makes an open editor notice instead of overwriting.
export async function patchCv(id: string, fn: (c: Cv) => Cv) {
  await db.transaction('rw', db.cvs, async () => {
    const c = await db.cvs.get(id);
    if (!c) return;
    const rev = (c.rev ?? 1) + 1;
    await db.cvs.put({ ...fn(normalizeCv(c)), rev, updatedAt: Date.now() });
    cvChannel?.postMessage({ id, rev });
  });
}

export async function deleteCv(id: string) {
  await db.transaction('rw', db.cvs, db.letters, db.assets, async () => {
    const cv = await db.cvs.get(id);
    await db.cvs.delete(id);
    if (cv?.photoId) await releaseAsset(cv.photoId);
  });
}

async function sha1(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Identical photos are stored once; duplicated CVs point at the same asset.
export async function putAsset(kind: Asset['kind'], data: string): Promise<string> {
  const id = await sha1(data);
  if (!(await db.assets.get(id))) await db.assets.put({ id, kind, data, createdAt: Date.now() });
  return id;
}

export async function releaseAsset(id: string) {
  const [cvUses, letterUses] = await Promise.all([db.cvs.filter((c) => c.photoId === id).count(), db.letters.filter((l) => l.signatureId === id).count()]);
  if (cvUses + letterUses === 0) await db.assets.delete(id);
}

export async function getAssetData(id: string | undefined): Promise<string | undefined> {
  if (!id) return undefined;
  return (await db.assets.get(id))?.data;
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
}
