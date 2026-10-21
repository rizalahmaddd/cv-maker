import { useId, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout';
import { Button, EmptyState, Field, Loading, Select, Sheet, TextArea, TextInput, useUI } from '../components/ui';
import { IconDownload, IconPlus, IconSearch, IconTrash } from '../components/icons';
import { db } from '../db';
import { uid, todayISO, daysBetween } from '../lib/id';
import { downloadFile } from '../lib/files';
import { formatDay } from '../lib/dates';
import { normalizeUrl } from '../lib/contact';
import type { Application, AppStatus } from '../types';

export const STATUSES: { key: AppStatus; label: string; cls: string }[] = [
  { key: 'saved', label: 'Disimpan', cls: 'bg-sunken text-muted' },
  { key: 'applied', label: 'Dilamar', cls: 'bg-brand-soft text-brand' },
  { key: 'test', label: 'Tes / psikotes', cls: 'bg-warn/12 text-warn' },
  { key: 'interview', label: 'Interview', cls: 'bg-warn/12 text-warn' },
  { key: 'offer', label: 'Penawaran', cls: 'bg-ok/12 text-ok' },
  { key: 'accepted', label: 'Diterima', cls: 'bg-ok/20 text-ok' },
  { key: 'rejected', label: 'Ditolak', cls: 'bg-danger/10 text-danger' },
];

const meta = (s: AppStatus) => STATUSES.find((x) => x.key === s) ?? STATUSES[0];

function blank(): Application {
  const now = Date.now();
  return { id: uid(), company: '', position: '', url: '', location: '', status: 'applied', appliedAt: todayISO(), followUpAt: '', salary: '', notes: '', createdAt: now, updatedAt: now };
}

function csvCell(v: string) {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function Editor({ app, onClose }: { app: Application; onClose: () => void }) {
  const { confirm } = useUI();
  const cvs = useLiveQuery(() => db.cvs.orderBy('updatedAt').reverse().toArray(), []);
  const letters = useLiveQuery(() => db.letters.orderBy('updatedAt').reverse().toArray(), []);
  const [draft, setDraft] = useState<Application>(app);
  const base = useId();
  const set = <K extends keyof Application>(k: K, v: Application[K]) => setDraft({ ...draft, [k]: v });
  const text = (k: 'company' | 'position' | 'location' | 'url' | 'salary', label: string, placeholder?: string) => (
    <Field label={label} htmlFor={`${base}-${k}`}>
      <TextInput id={`${base}-${k}`} value={draft[k]} placeholder={placeholder} inputMode={k === 'url' ? 'url' : undefined} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );
  const save = async () => {
    await db.applications.put({ ...draft, company: draft.company.trim(), position: draft.position.trim(), updatedAt: Date.now() });
    onClose();
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Hapus catatan lamaran?', confirmLabel: 'Hapus', danger: true }))) return;
    await db.applications.delete(draft.id);
    onClose();
  };
  return (
    <Sheet
      open
      onClose={onClose}
      title={draft.company ? draft.company : 'Catat lamaran'}
      footer={
        <div className="flex gap-2">
          <Button variant="danger" onClick={remove} aria-label="Hapus">
            <IconTrash size={18} />
          </Button>
          <Button variant="primary" className="flex-1" onClick={save} disabled={!draft.company.trim()}>
            Simpan
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {text('company', 'Perusahaan', 'PT Contoh Jaya')}
          {text('position', 'Posisi', 'Staff Admin')}
          <Field label="Status" htmlFor={`${base}-status`}>
            <Select id={`${base}-status`} value={draft.status} onChange={(e) => set('status', e.target.value as AppStatus)}>
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          {text('location', 'Lokasi', 'Jakarta / remote')}
          <Field label="Tanggal melamar" htmlFor={`${base}-applied`}>
            <TextInput id={`${base}-applied`} type="date" value={draft.appliedAt} onChange={(e) => set('appliedAt', e.target.value)} />
          </Field>
          <Field label="Ingatkan follow-up" htmlFor={`${base}-follow`} hint="Biasanya 1–2 minggu setelah melamar.">
            <TextInput id={`${base}-follow`} type="date" value={draft.followUpAt} onChange={(e) => set('followUpAt', e.target.value)} />
          </Field>
          {text('url', 'Tautan lowongan', 'jobstreet.co.id/...')}
          {text('salary', 'Gaji ditawarkan / diharapkan', 'Rp6–7 juta')}
          <Field label="CV yang dikirim" htmlFor={`${base}-cv`}>
            <Select id={`${base}-cv`} value={draft.cvId ?? ''} onChange={(e) => set('cvId', e.target.value || undefined)}>
              <option value="">Tidak dicatat</option>
              {cvs?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.personal.fullName || 'CV tanpa nama'}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Surat lamaran" htmlFor={`${base}-letter`}>
            <Select id={`${base}-letter`} value={draft.letterId ?? ''} onChange={(e) => set('letterId', e.target.value || undefined)}>
              <option value="">Tidak dicatat</option>
              {letters?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.subject || l.company || 'Surat'}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Catatan" htmlFor={`${base}-notes`}>
          <TextArea id={`${base}-notes`} rows={3} value={draft.notes} placeholder="Nama HRD, jadwal tes, hasil interview…" onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}

export function Applications() {
  const apps = useLiveQuery(() => db.applications.orderBy('updatedAt').reverse().toArray(), []);
  const navigate = useNavigate();
  const location = useLocation();
  const [editing, setEditing] = useState<Application | null>(() => {
    const draft = (location.state as { draft?: Partial<Application> } | null)?.draft;
    return draft ? { ...blank(), ...draft } : null;
  });
  const [filter, setFilter] = useState<AppStatus | 'all' | 'active'>('active');
  const [q, setQ] = useState('');
  const today = todayISO();

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (apps ?? [])
      .filter((a) => (filter === 'all' ? true : filter === 'active' ? !['accepted', 'rejected'].includes(a.status) : a.status === filter))
      .filter((a) => !term || `${a.company} ${a.position} ${a.location}`.toLowerCase().includes(term))
      .sort((a, b) => (a.followUpAt && a.followUpAt <= today ? -1 : 0) - (b.followUpAt && b.followUpAt <= today ? -1 : 0) || b.appliedAt.localeCompare(a.appliedAt));
  }, [apps, filter, q, today]);

  if (!apps) return <Loading />;

  const counts = Object.fromEntries(STATUSES.map((s) => [s.key, apps.filter((a) => a.status === s.key).length])) as Record<AppStatus, number>;
  const due = apps.filter((a) => a.followUpAt && a.followUpAt <= today && !['accepted', 'rejected'].includes(a.status)).length;

  const exportCsv = () => {
    const head = ['Perusahaan', 'Posisi', 'Status', 'Tanggal melamar', 'Follow-up', 'Lokasi', 'Gaji', 'Tautan', 'Catatan'];
    const rows = apps.map((a) => [a.company, a.position, meta(a.status).label, a.appliedAt, a.followUpAt, a.location, a.salary, a.url, a.notes]);
    const body = [head, ...rows].map((r) => r.map((v) => csvCell(v ?? '')).join(',')).join('\n');
    downloadFile(new File(['﻿' + body], `lamaran-${today}.csv`, { type: 'text/csv' }));
  };

  return (
    <div>
      <PageHeader
        title="Pelacak Lamaran"
        sub={
          apps.length ? `${apps.length} lamaran · ${counts.interview + counts.test} tahap seleksi · ${counts.offer + counts.accepted} penawaran` : 'Catat setiap lamaran supaya tidak ada yang terlewat'
        }
        actions={
          <>
            {apps.length > 0 && (
              <Button onClick={exportCsv} aria-label="Ekspor CSV">
                <IconDownload size={18} /> CSV
              </Button>
            )}
            <Button variant="primary" onClick={() => setEditing(blank())}>
              <IconPlus size={18} /> Catat
            </Button>
          </>
        }
      />
      {due > 0 && (
        <div className="mb-4 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm">
          <b>{due} lamaran</b> sudah waktunya di-follow-up. Kirim pesan sopan ke HRD menanyakan perkembangan lamaran.
        </div>
      )}
      {apps.length === 0 ? (
        <EmptyState
          title="Belum ada lamaran tercatat"
          body="Catat perusahaan, posisi, CV yang dikirim, dan jadwal follow-up. Semua tersimpan di perangkat ini."
          action={
            <Button variant="primary" size="lg" onClick={() => setEditing(blank())}>
              <IconPlus size={18} /> Catat lamaran pertama
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {[{ key: 'active', label: 'Berjalan' }, { key: 'all', label: 'Semua' }, ...STATUSES].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setFilter(s.key as typeof filter)}
                  className={`min-h-9 shrink-0 rounded-full border px-3 text-sm font-semibold ${filter === s.key ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:text-text'}`}
                >
                  {s.label}
                  {s.key in counts && counts[s.key as AppStatus] ? <span className="ml-1 opacity-70">{counts[s.key as AppStatus]}</span> : null}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto sm:w-64">
              <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
              <TextInput aria-label="Cari lamaran" placeholder="Cari perusahaan / posisi" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
          </div>
          <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((a) => {
              const m = meta(a.status);
              const late = a.followUpAt && a.followUpAt <= today && !['accepted', 'rejected'].includes(a.status);
              return (
                <li key={a.id} className="min-w-0">
                  <button type="button" onClick={() => setEditing(a)} className="flex w-full flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4 text-left hover:shadow-sm">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-bold">{a.company}</span>
                        <span className="block truncate text-sm text-muted">{a.position || 'Posisi belum diisi'}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${m.cls}`}>{m.label}</span>
                    </span>
                    <span className="text-xs text-muted">
                      Dilamar {a.appliedAt ? formatDay(a.appliedAt, 'id') : '-'}
                      {a.appliedAt ? ` · ${daysBetween(a.appliedAt, today) <= 0 ? 'hari ini' : `${daysBetween(a.appliedAt, today)} hari lalu`}` : ''}
                      {a.location ? ` · ${a.location}` : ''}
                    </span>
                    {a.followUpAt && <span className={`text-xs font-semibold ${late ? 'text-warn' : 'text-muted'}`}>Follow-up {formatDay(a.followUpAt, 'id')}</span>}
                  </button>
                  {a.url && (
                    <a href={normalizeUrl(a.url)} target="_blank" rel="noreferrer" className="mt-1 inline-block px-1 text-xs font-semibold text-brand underline-offset-2 hover:underline">
                      Buka lowongan
                    </a>
                  )}
                  {a.cvId && (
                    <button type="button" onClick={() => navigate(`/cv/${a.cvId}/lihat`)} className="mt-1 ml-3 px-1 text-xs font-semibold text-muted hover:text-text">
                      Lihat CV
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {!shown.length && <p className="py-8 text-center text-sm text-muted">Tidak ada lamaran untuk filter ini.</p>}
        </>
      )}
      {editing && (
        <Editor
          key={editing.id}
          app={editing}
          onClose={() => {
            setEditing(null);
            if (location.state) navigate(location.pathname, { replace: true, state: null });
          }}
        />
      )}
    </div>
  );
}
