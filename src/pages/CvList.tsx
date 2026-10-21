import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout';
import { Button, EmptyState, Loading, Sheet, useUI } from '../components/ui';
import { IconCopy, IconDownload, IconEdit, IconMore, IconPlus, IconTrash, IconUpload } from '../components/icons';
import { CvThumb } from '../components/TemplateThumb';
import { InstallBanner } from '../components/InstallBanner';
import { db, deleteCv, duplicateCv, normalizeCv } from '../db';
import { useAllTemplates, useAsset, useSettings } from '../hooks';
import { countryPreset } from '../presets/countries';
import { cvProgress, relativeTime } from '../lib/progress';
import { BUILTIN_TEMPLATES } from '../templates';
import type { Cv, TemplateConfig } from '../types';

function CvCard({ cv, tpl, onMore }: { cv: Cv; tpl: TemplateConfig; onMore: () => void }) {
  const photo = useAsset(cv.photoId);
  const progress = cvProgress(cv);
  const name = cv.personal.fullName.trim() || 'Tanpa nama';
  return (
    <li className="flex min-w-0 gap-3 rounded-2xl border border-line bg-surface p-3 sm:flex-col sm:p-4">
      <Link to={`/cv/${cv.id}`} className="w-24 shrink-0 sm:w-full" aria-label={`Edit CV ${name}`}>
        {photo !== undefined ? <CvThumb cv={cv} tpl={tpl} photo={photo ?? undefined} alt={`Pratinjau CV ${name}`} /> : <div className="paper-skeleton" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/cv/${cv.id}`} className="min-w-0">
            <p className="truncate text-[15px] font-bold">{cv.title || name}</p>
            <p className="truncate text-sm text-muted">{cv.targetRole || cv.personal.headline || 'Posisi belum diisi'}</p>
          </Link>
          <button
            type="button"
            onClick={onMore}
            aria-label={`Menu CV ${name}`}
            className="-mr-1 -mt-1 inline-grid size-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-sunken hover:text-text"
          >
            <IconMore size={18} />
          </button>
        </div>
        <p className="mt-1 truncate text-xs text-muted">
          {tpl.name} · {countryPreset(cv.country).name} · {cv.lang === 'id' ? 'ID' : 'EN'}
        </p>
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{progress < 100 ? `Kelengkapan ${progress}%` : 'Lengkap'}</span>
            <span>{relativeTime(cv.updatedAt)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Kelengkapan CV">
            <div className={`h-full rounded-full ${progress < 100 ? 'bg-brand' : 'bg-ok'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </li>
  );
}

export function CvList() {
  const navigate = useNavigate();
  const { toast, confirm } = useUI();
  const settings = useSettings();
  const templates = useAllTemplates();
  const cvs = useLiveQuery(async () => (await db.cvs.orderBy('updatedAt').reverse().toArray()).map(normalizeCv), []);
  const [menu, setMenu] = useState<Cv | null>(null);

  if (!cvs || !templates) return <Loading />;

  const tplOf = (id: string) => templates.find((t) => t.id === id) ?? BUILTIN_TEMPLATES[0];
  const staleBackup = cvs.length > 0 && (!settings?.lastBackupAt || Date.now() - settings.lastBackupAt > 14 * 86400000);

  const remove = async (cv: Cv) => {
    const ok = await confirm({
      title: 'Hapus CV ini?',
      message: `CV "${cv.title || cv.personal.fullName || 'Tanpa nama'}" akan dihapus dari perangkat ini dan tidak bisa dikembalikan.`,
      confirmLabel: 'Hapus',
      danger: true,
    });
    setMenu(null);
    if (!ok) return;
    await deleteCv(cv.id);
    toast('CV dihapus.');
  };

  const duplicate = async (cv: Cv) => {
    setMenu(null);
    const copy = await duplicateCv(cv.id);
    if (copy) {
      toast('CV disalin.', 'ok', { label: 'Buka', onClick: () => navigate(`/cv/${copy.id}`) });
    }
  };

  return (
    <div>
      <PageHeader
        title="CV Saya"
        sub={cvs.length ? `${cvs.length} CV tersimpan di perangkat ini` : 'Semua data tersimpan di perangkat Anda'}
        actions={
          <>
            <Button onClick={() => navigate('/impor')}>
              <IconUpload size={18} /> Impor
            </Button>
            {cvs.length ? (
              <Button variant="primary" onClick={() => navigate('/baru')}>
                <IconPlus size={18} /> Buat CV
              </Button>
            ) : null}
          </>
        }
      />

      <InstallBanner />
      {staleBackup && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-warn/30 bg-warn/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-bold">Belum ada backup baru.</span> Data CV hanya tersimpan di browser ini. Simpan file backup supaya aman bila browser dibersihkan atau ganti HP.
          </p>
          <Link to="/pengaturan#backup" className="shrink-0 font-bold text-text underline underline-offset-2">
            Backup sekarang
          </Link>
        </div>
      )}

      {cvs.length === 0 ? (
        <EmptyState
          title="Belum ada CV"
          body="Buat CV pertama Anda dalam beberapa menit. Pilih template siap ATS atau format formal dengan foto, lalu unduh PDF atau Word."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" size="lg" onClick={() => navigate('/baru')}>
                <IconPlus size={18} /> Buat CV pertama
              </Button>
              <Button size="lg" onClick={() => navigate('/impor')}>
                <IconUpload size={18} /> Impor dari PDF / LinkedIn
              </Button>
            </div>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cvs.map((cv) => (
            <CvCard key={cv.id} cv={cv} tpl={tplOf(cv.templateId)} onMore={() => setMenu(cv)} />
          ))}
        </ul>
      )}

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.title || menu?.personal.fullName || 'CV'}>
        {menu && (
          <div className="flex flex-col gap-2">
            <Button block onClick={() => navigate(`/cv/${menu.id}`)} className="justify-start">
              <IconEdit size={18} /> Edit
            </Button>
            <Button block onClick={() => navigate(`/cv/${menu.id}/lihat`)} className="justify-start">
              <IconDownload size={18} /> Lihat & unduh
            </Button>
            <Button block onClick={() => duplicate(menu)} className="justify-start">
              <IconCopy size={18} /> Duplikat (untuk lowongan lain)
            </Button>
            <Button block variant="danger" onClick={() => remove(menu)} className="justify-start">
              <IconTrash size={18} /> Hapus
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
