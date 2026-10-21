import { db, getSettings, normalizeCv, updateSettings } from '../db';
import type { Application, Asset, Cv, Letter, Settings, TemplateConfig } from '../types';
import { todayISO } from './id';

const VERSION = 1;

interface BackupFile {
  app: 'cv-maker';
  version: number;
  exportedAt: string;
  settings: Settings;
  cvs: Cv[];
  letters: Letter[];
  assets: Asset[];
  templates: TemplateConfig[];
  applications: Application[];
}

export async function exportBackup(): Promise<File> {
  const data: BackupFile = {
    app: 'cv-maker',
    version: VERSION,
    exportedAt: new Date().toISOString(),
    settings: await getSettings(),
    cvs: await db.cvs.toArray(),
    letters: await db.letters.toArray(),
    assets: await db.assets.toArray(),
    templates: await db.templates.toArray(),
    applications: await db.applications.toArray(),
  };
  return new File([JSON.stringify(data)], `backup-cv-${todayISO()}.json`, { type: 'application/json' });
}

export async function markBackedUp() {
  await updateSettings({ lastBackupAt: Date.now() });
}

export async function readBackup(file: File): Promise<BackupFile> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('File ini bukan JSON yang valid.');
  }
  const b = parsed as Partial<BackupFile>;
  if (b?.app !== 'cv-maker' || !Array.isArray(b.cvs)) throw new Error('File ini bukan backup dari CV Maker.');
  if ((b.version ?? 0) > VERSION) throw new Error('Backup ini dibuat oleh versi aplikasi yang lebih baru. Muat ulang aplikasi lalu coba lagi.');
  const rows = <T extends Row>(v: T[] | undefined) => (Array.isArray(v) ? v.filter((r) => r && typeof r.id === 'string') : []);
  return {
    app: 'cv-maker',
    version: b.version ?? VERSION,
    exportedAt: b.exportedAt ?? '',
    settings: { ...(await getSettings()), ...b.settings, id: 'app' },
    cvs: rows(b.cvs),
    letters: rows(b.letters),
    assets: rows(b.assets),
    templates: rows(b.templates),
    applications: rows(b.applications),
  };
}

export function backupSummary(b: BackupFile) {
  return { cvs: b.cvs.length, letters: b.letters.length, templates: b.templates.length, applications: b.applications.length, exportedAt: b.exportedAt };
}

export type ImportMode = 'merge' | 'replace';

type Row = { id: string; updatedAt?: number };

// Merge keeps whichever copy of a record was edited last, so restoring an older backup never overwrites newer work.
export async function importBackup(b: BackupFile, mode: ImportMode) {
  const tables = [db.cvs, db.letters, db.assets, db.templates, db.applications, db.settings];
  await db.transaction('rw', tables, async () => {
    if (mode === 'replace') {
      await Promise.all([db.cvs.clear(), db.letters.clear(), db.assets.clear(), db.templates.clear(), db.applications.clear()]);
      await db.settings.put({ ...(await getSettings()), ...b.settings, id: 'app' });
      await db.cvs.bulkPut(b.cvs.map(normalizeCv));
      await db.letters.bulkPut(b.letters);
      await db.assets.bulkPut(b.assets);
      await db.templates.bulkPut(b.templates);
      await db.applications.bulkPut(b.applications);
      return;
    }
    for (const a of b.assets) if (!(await db.assets.get(a.id))) await db.assets.put(a);
    for (const row of b.cvs) {
      const local = await db.cvs.get(row.id);
      // A higher revision makes an open editor notice the change instead of overwriting it on its next save.
      if (!local || (row.updatedAt ?? 0) > (local.updatedAt ?? 0)) await db.cvs.put({ ...normalizeCv(row), rev: Math.max(local?.rev ?? 0, row.rev ?? 0) + 1 });
    }
    const merge = async <T extends Row>(table: { get: (id: string) => Promise<T | undefined>; put: (r: T) => Promise<unknown> }, rows: T[]) => {
      for (const row of rows) {
        const local = await table.get(row.id);
        if (!local || (row.updatedAt ?? 0) > (local.updatedAt ?? 0)) await table.put(row);
      }
    };
    await merge(db.letters, b.letters);
    await merge(db.templates, b.templates);
    await merge(db.applications, b.applications);
  });
}

export async function wipeAll() {
  await db.delete();
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('thumb:') || k.startsWith('cv:'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
  if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
}
