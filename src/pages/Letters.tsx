import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout';
import { Button, EmptyState, Field, Loading, Select, Sheet, useUI } from '../components/ui';
import { IconCopy, IconPlus, IconTrash } from '../components/icons';
import { db, releaseAsset } from '../db';
import { createLetter, normalizeLetter } from '../lib/letter';
import { relativeTime } from '../lib/progress';
import { uid } from '../lib/id';
import type { Letter } from '../types';

export function Letters() {
  const navigate = useNavigate();
  const { toast, confirm } = useUI();
  const letters = useLiveQuery(async () => (await db.letters.orderBy('updatedAt').reverse().toArray()).map(normalizeLetter), []);
  const cvs = useLiveQuery(() => db.cvs.orderBy('updatedAt').reverse().toArray(), []);
  const [picking, setPicking] = useState(false);
  const [cvId, setCvId] = useState('');

  if (!letters || !cvs) return <Loading />;

  const create = async () => {
    const l = await createLetter(cvId || cvs[0]?.id);
    setPicking(false);
    navigate(`/surat/${l.id}`);
  };

  const remove = async (l: Letter) => {
    const ok = await confirm({ title: 'Hapus surat ini?', message: `"${l.subject || 'Surat lamaran'}" akan dihapus.`, confirmLabel: 'Hapus', danger: true });
    if (!ok) return;
    await db.letters.delete(l.id);
    if (l.signatureId) await releaseAsset(l.signatureId);
    toast('Surat dihapus.');
  };

  const duplicate = async (l: Letter) => {
    const copy = { ...structuredClone(l), id: uid(), title: '', createdAt: Date.now(), updatedAt: Date.now() };
    await db.letters.add(copy);
    navigate(`/surat/${copy.id}`);
  };

  const cvName = (id?: string) => {
    const c = cvs.find((x) => x.id === id);
    return c ? c.title || c.personal.fullName || 'CV tanpa nama' : 'Tanpa CV';
  };

  return (
    <div>
      <PageHeader
        title="Surat Lamaran"
        sub="Surat lamaran formal Indonesia dan cover letter bahasa Inggris"
        actions={
          letters.length ? (
            <Button variant="primary" onClick={() => setPicking(true)}>
              <IconPlus size={18} /> Buat surat
            </Button>
          ) : null
        }
      />
      {letters.length === 0 ? (
        <EmptyState
          title="Belum ada surat lamaran"
          body="Buat surat lamaran yang otomatis terisi dari data CV: posisi, pendidikan, keahlian, dan daftar berkas lampiran."
          action={
            <Button variant="primary" size="lg" onClick={() => setPicking(true)}>
              <IconPlus size={18} /> Buat surat pertama
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map((l) => (
            <li key={l.id} className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4">
              <Link to={`/surat/${l.id}`} className="min-w-0">
                <p className="truncate text-[15px] font-bold">{l.title || l.subject || 'Surat lamaran'}</p>
                <p className="truncate text-sm text-muted">{[l.company, l.position].filter(Boolean).join(' · ') || 'Perusahaan belum diisi'}</p>
              </Link>
              <p className="mt-2 truncate text-xs text-muted">
                {cvName(l.cvId)} · {l.lang === 'id' ? 'ID' : 'EN'} · {relativeTime(l.updatedAt)}
              </p>
              <div className="mt-3 flex gap-1 border-t border-line pt-2">
                <Button size="sm" variant="ghost" onClick={() => navigate(`/surat/${l.id}`)}>
                  Buka
                </Button>
                <Button size="sm" variant="ghost" onClick={() => duplicate(l)}>
                  <IconCopy size={16} /> Duplikat
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto text-danger" onClick={() => remove(l)} aria-label="Hapus surat">
                  <IconTrash size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Sheet
        open={picking}
        onClose={() => setPicking(false)}
        title="Buat surat lamaran"
        footer={
          <Button variant="primary" block onClick={create}>
            Buat surat
          </Button>
        }
      >
        <Field label="Ambil data dari CV" htmlFor="letter-cv" hint="Nama, kontak, pendidikan, dan keahlian diambil dari CV ini. Bisa diganti nanti.">
          <Select id="letter-cv" value={cvId || cvs[0]?.id || ''} onChange={(e) => setCvId(e.target.value)}>
            {cvs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || c.personal.fullName || 'CV tanpa nama'}
                {c.targetRole ? ` · ${c.targetRole}` : ''}
              </option>
            ))}
            <option value="none">Tanpa CV</option>
          </Select>
        </Field>
        {!cvs.length && <p className="mt-3 text-sm text-muted">Belum ada CV. Surat tetap bisa dibuat, tetapi nama dan kontak perlu diisi lewat CV.</p>}
      </Sheet>
    </div>
  );
}
