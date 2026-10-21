import { useEffect, useId, useState } from 'react';
import { PageHeader } from '../components/layout';
import { Button, Card, Field, Loading, Segmented, Select, SectionTitle, Sheet, TextArea, TextInput, useUI } from '../components/ui';
import { IconDownload, IconUpload } from '../components/icons';
import { storageEstimate, updateSettings } from '../db';
import { useSettings } from '../hooks';
import { backupSummary, exportBackup, importBackup, markBackedUp, readBackup, wipeAll, type ImportMode } from '../lib/backup';
import { shareOrDownload } from '../lib/files';
import { COUNTRIES } from '../presets/countries';
import type { CountryKey, Lang, ThemePref } from '../types';

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function SettingsPage() {
  const s = useSettings();
  const { toast, confirm } = useUI();
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [pending, setPending] = useState<Awaited<ReturnType<typeof readBackup>> | null>(null);
  const fileId = useId();
  const base = useId();

  useEffect(() => {
    storageEstimate().then(setUsage);
  }, []);

  useEffect(() => {
    if (window.location.hash === '#backup') document.getElementById('backup')?.scrollIntoView({ block: 'start' });
  }, [s?.id]);

  if (!s) return <Loading />;

  const doExport = async () => {
    const file = await exportBackup();
    const r = await shareOrDownload(file);
    if (r !== 'cancelled') {
      await markBackedUp();
      toast('Backup tersimpan. Simpan file ini di tempat aman (Google Drive, email).');
    }
  };

  const doImport = async (mode: ImportMode) => {
    if (!pending) return;
    if (mode === 'replace') {
      const ok = await confirm({ title: 'Ganti semua data?', message: 'Semua CV, surat, dan template di perangkat ini akan diganti dengan isi backup.', confirmLabel: 'Ganti data', danger: true });
      if (!ok) return;
    }
    try {
      await importBackup(pending, mode);
      setPending(null);
      toast('Backup berhasil dipulihkan.');
    } catch (e) {
      toast((e as Error).message || 'Backup gagal dipulihkan.', 'error');
    }
  };

  const wipe = async () => {
    const ok = await confirm({
      title: 'Hapus semua data?',
      message: 'Semua CV, foto, surat, dan template di browser ini akan dihapus permanen. Buat backup dulu bila masih diperlukan.',
      confirmLabel: 'Hapus semua',
      danger: true,
    });
    if (!ok) return;
    await wipeAll();
    window.location.replace('/');
  };

  const summary = pending ? backupSummary(pending) : null;

  return (
    <div>
      <PageHeader title="Pengaturan" />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle>Tampilan</SectionTitle>
            <Segmented<ThemePref>
              label="Tema"
              value={s.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                { value: 'system', label: 'Ikuti sistem' },
                { value: 'light', label: 'Terang' },
                { value: 'dark', label: 'Gelap' },
              ]}
            />
          </Card>
          <Card>
            <SectionTitle>Bawaan CV baru</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Negara tujuan" htmlFor={`${base}-country`}>
                <Select id={`${base}-country`} value={s.defaults.country} onChange={(e) => updateSettings((x) => ({ ...x, defaults: { ...x.defaults, country: e.target.value as CountryKey } }))}>
                  {COUNTRIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Bahasa">
                <Segmented<Lang>
                  label="Bahasa"
                  value={s.defaults.lang}
                  onChange={(lang) => updateSettings((x) => ({ ...x, defaults: { ...x.defaults, lang } }))}
                  options={[
                    { value: 'id', label: 'Indonesia' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </Field>
            </div>
          </Card>
          <Card>
            <SectionTitle>Nama file & pesan</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="Pola nama file" htmlFor={`${base}-file`} hint="Kode: {nama}, {posisi}, {perusahaan}, {tanggal}. Contoh hasil: CV_Nadia_Putri_Marketing_Staff.pdf">
                <TextInput id={`${base}-file`} value={s.fileNamePattern} onChange={(e) => updateSettings({ fileNamePattern: e.target.value })} />
              </Field>
              <Field label="Pesan saat membagikan CV" htmlFor={`${base}-msg`} hint="Kode: {nama}, {posisi}">
                <TextArea id={`${base}-msg`} value={s.shareMessage} onChange={(e) => updateSettings({ shareMessage: e.target.value })} />
              </Field>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <div id="backup" className="scroll-mt-6">
              <SectionTitle>Backup & pindah perangkat</SectionTitle>
            </div>
            <p className="mb-3 text-sm text-muted">
              Data hanya tersimpan di browser ini. Simpan file backup secara berkala, lalu pulihkan di HP atau laptop lain.
              {s.lastBackupAt ? ` Backup terakhir: ${new Date(s.lastBackupAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}.` : ' Belum pernah backup.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={doExport}>
                <IconDownload size={18} /> Simpan backup
              </Button>
              <label
                htmlFor={fileId}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-sunken focus-within:outline-2 focus-within:outline-[var(--focus)]"
              >
                <IconUpload size={18} /> Pulihkan dari file
                <input
                  id={fileId}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    try {
                      setPending(await readBackup(f));
                    } catch (err) {
                      toast((err as Error).message, 'error');
                    }
                  }}
                />
              </label>
            </div>
            {usage && usage.quota > 0 && (
              <p className="mt-3 text-xs text-muted">
                Penyimpanan terpakai {formatBytes(usage.usage)} dari kuota {formatBytes(usage.quota)}.
              </p>
            )}
          </Card>
          <Card>
            <SectionTitle>Hapus data</SectionTitle>
            <p className="mb-3 text-sm text-muted">Menghapus semua CV, foto, surat, template, dan cache aplikasi dari browser ini.</p>
            <Button variant="danger" onClick={wipe}>
              Hapus semua data
            </Button>
          </Card>
        </div>
      </div>
      <p className="pt-6 pb-4 text-center text-xs text-muted">CV Maker · data tersimpan di perangkat Anda, tidak dikirim ke server mana pun.</p>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Pulihkan backup"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => doImport('replace')}>Ganti semua data</Button>
            <Button variant="primary" onClick={() => doImport('merge')}>
              Gabungkan
            </Button>
          </div>
        }
      >
        {summary && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              Berisi <b>{summary.cvs} CV</b>, {summary.letters} surat, {summary.templates} template, dan {summary.applications} catatan lamaran.
            </p>
            {summary.exportedAt && <p className="text-muted">Dibuat {new Date(summary.exportedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}.</p>}
            <p className="text-muted">
              <b>Gabungkan</b> menyimpan versi yang terakhir diubah dari tiap CV. <b>Ganti</b> menghapus data di perangkat ini lalu memakai isi backup.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
