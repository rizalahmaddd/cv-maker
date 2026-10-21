import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Cv, Section, SectionType } from '../types';
import { Button, EmptyState, IconButton, Loading, Sheet, useUI } from '../components/ui';
import { IconBack, IconCheck, IconChevronDown, IconDownload, IconEye, IconEyeOff, IconGear, IconPlus, IconRedo, IconTrash, IconUndo, IconUser, IconWarning } from '../components/icons';
import { PdfPreview } from '../components/PdfPreview';
import { emptySection } from '../db';
import { useAsset, useCvEditor, useCvPdf, useMedia, useTemplate, type SaveState } from '../hooks';
import { SECTION_DEFS, SECTION_ORDER, sectionTitle } from '../presets/sections';
import { sectionHasContent } from '../lib/content';
import { SectionForm } from '../editor/SectionForm';
import { EditorCtx } from '../editor/context';
import { PersonalForm } from '../editor/PersonalForm';
import { SetupForm } from '../editor/SetupForm';
import { DragHandle, SortableList } from '../editor/Sortable';

const MULTI: SectionType[] = ['custom'];

function SaveBadge({ state }: { state: SaveState }) {
  const meta = {
    saved: { text: 'Tersimpan', cls: 'text-muted', icon: <IconCheck size={14} /> },
    pending: { text: 'Menyimpan...', cls: 'text-muted', icon: null },
    error: { text: 'Gagal menyimpan', cls: 'text-danger', icon: <IconWarning size={14} /> },
    conflict: { text: 'Bentrok', cls: 'text-warn', icon: <IconWarning size={14} /> },
  }[state];
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.cls}`}>
      {meta.icon}
      {meta.text}
    </span>
  );
}

interface NavItem {
  key: string;
  label: string;
  done: boolean;
  section?: Section;
}

function navItems(cv: Cv): NavItem[] {
  return [
    { key: 'setup', label: 'Pengaturan CV', done: true },
    { key: 'personal', label: 'Data diri', done: !!cv.personal.fullName.trim() && !!(cv.personal.email.trim() || cv.personal.phone.trim()) },
    ...cv.sections.map((s) => ({ key: s.id, label: sectionTitle(s.type, 'id', s.title), done: sectionHasContent(s), section: s })),
  ];
}

function Nav({
  cv,
  active,
  onPick,
  onReorder,
  onToggle,
  onAdd,
}: {
  cv: Cv;
  active: string | null;
  onPick: (key: string) => void;
  onReorder: (sections: Section[]) => void;
  onToggle: (s: Section) => void;
  onAdd: () => void;
}) {
  const items = navItems(cv);
  const fixed = items.slice(0, 2);
  const row = (it: NavItem, handle?: React.ReactNode) => (
    <div className={`flex items-center gap-1 rounded-xl ${active === it.key ? 'bg-sunken' : 'hover:bg-sunken/60'} ${it.section && !it.section.visible ? 'opacity-55' : ''}`}>
      {handle ?? <span className="inline-grid size-10 shrink-0 place-items-center text-muted">{it.key === 'setup' ? <IconGear size={17} /> : <IconUser size={17} />}</span>}
      <button type="button" onClick={() => onPick(it.key)} aria-current={active === it.key ? 'step' : undefined} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
        <span className={`size-2 shrink-0 rounded-full ${it.done ? 'bg-ok' : 'bg-line'}`} aria-hidden="true" />
        <span className={`min-w-0 flex-1 truncate text-sm ${active === it.key ? 'font-bold' : 'font-semibold'}`}>{it.label}</span>
      </button>
      {it.section ? (
        <button
          type="button"
          onClick={() => onToggle(it.section!)}
          aria-label={it.section.visible ? `Sembunyikan ${it.label} dari CV` : `Tampilkan ${it.label} di CV`}
          title={it.section.visible ? 'Sembunyikan dari CV' : 'Tampilkan di CV'}
          className="inline-grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:text-text"
        >
          {it.section.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}
        </button>
      ) : null}
    </div>
  );
  return (
    <nav aria-label="Bagian CV" className="flex flex-col gap-0.5">
      {fixed.map((it) => (
        <div key={it.key}>{row(it)}</div>
      ))}
      <p className="mt-3 mb-1 px-2 text-[11px] font-bold tracking-wide text-muted uppercase">Bagian · seret untuk mengurutkan</p>
      <SortableList items={cv.sections} onReorder={onReorder} className="flex flex-col gap-0.5">
        {(s, handle) =>
          row(
            items.find((i) => i.key === s.id)!,
            <DragHandle handle={handle} label={`Pindahkan ${sectionTitle(s.type, 'id', s.title)}`} />,
          )
        }
      </SortableList>
      <Button variant="ghost" onClick={onAdd} className="mt-1 justify-start">
        <IconPlus size={18} /> Tambah bagian
      </Button>
    </nav>
  );
}

function AddSectionSheet({ open, onClose, cv, onAdd }: { open: boolean; onClose: () => void; cv: Cv; onAdd: (t: SectionType) => void }) {
  const used = new Set(cv.sections.map((s) => s.type));
  const options = SECTION_ORDER.filter((t) => MULTI.includes(t) || !used.has(t));
  return (
    <Sheet open={open} onClose={onClose} title="Tambah bagian">
      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((t) => (
          <li key={t} className="min-w-0">
            <button
              type="button"
              onClick={() => {
                onAdd(t);
                onClose();
              }}
              className="flex min-h-16 w-full flex-col justify-center rounded-xl border border-line px-4 py-2.5 text-left hover:bg-sunken"
            >
              <span className="text-sm font-bold">{SECTION_DEFS[t].name.id}</span>
              <span className="line-clamp-2 text-xs text-muted">{SECTION_DEFS[t].hint}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

export function CvEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();
  const [params, setParams] = useSearchParams();
  const ed = useCvEditor(id);
  const { cv, update } = ed;
  const tpl = useTemplate(cv?.templateId);
  const photo = useAsset(cv?.photoId);
  const wide = useMedia('(min-width: 1024px)');
  const xl = useMedia('(min-width: 1280px)');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const fresh = !!(location.state as { fresh?: boolean } | null)?.fresh;
  const active = params.get('p') ?? (wide || fresh ? 'personal' : null);
  const pdf = useCvPdf(wide || previewOpen ? cv : null, tpl, photo, wide ? 500 : 250);

  const items = useMemo(() => (cv ? navItems(cv) : []), [cv]);
  const index = items.findIndex((i) => i.key === active);
  const current = index >= 0 ? items[index] : null;

  // On phones the section list and a section form are separate screens; only entering a form adds a history
  // entry, so the back button returns to the list instead of stepping through every visited section.
  const pushed = useRef(false);
  const go = (key: string | null) => {
    setNavOpen(false);
    if (!key && pushed.current) {
      pushed.current = false;
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(params);
    if (key) next.set('p', key);
    else next.delete('p');
    const push = !wide && !active && !!key;
    if (push) pushed.current = true;
    setParams(next, { replace: !push });
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: 'start' }));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        ed.undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        ed.redo();
      } else if (k === 's') {
        e.preventDefault();
        ed.flush();
        toast('Tersimpan. Perubahan juga tersimpan otomatis.');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ed.undo, ed.redo, ed.flush]);

  if (ed.missing)
    return (
      <EmptyState
        title="CV tidak ditemukan"
        body="CV ini mungkin sudah dihapus atau dibuat di perangkat lain."
        action={
          <Link to="/" className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-bg">
            Ke daftar CV
          </Link>
        }
      />
    );
  if (!cv) return <Loading />;

  const updateSection = (sid: string) => (fn: (s: Section) => Section, key?: string) => update((c) => ({ ...c, sections: c.sections.map((s) => (s.id === sid ? fn(s) : s)) }), key);
  const addSection = (t: SectionType) => {
    const s = emptySection(t);
    update((c) => ({ ...c, sections: [...c.sections, s] }));
    go(s.id);
  };
  const removeSection = (s: Section) => {
    const i = items.findIndex((x) => x.key === s.id);
    update((c) => ({ ...c, sections: c.sections.filter((x) => x.id !== s.id) }));
    go(items[i - 1]?.key ?? 'personal');
    toast(`Bagian "${sectionTitle(s.type, 'id', s.title)}" dihapus.`, 'ok', { label: 'Urungkan', onClick: ed.undo });
  };
  const toggleSection = (s: Section) => update((c) => ({ ...c, sections: c.sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)) }));

  const name = cv.personal.fullName.trim() || 'CV tanpa nama';
  const nav = <Nav cv={cv} active={active} onPick={go} onReorder={(sections) => update((c) => ({ ...c, sections }))} onToggle={toggleSection} onAdd={() => setAdding(true)} />;

  const panel = current ? (
    <section aria-labelledby="panel-title" className="min-w-0">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">
            Langkah {index + 1} dari {items.length}
          </p>
          <h2 id="panel-title" className="truncate text-lg font-extrabold tracking-tight">
            {current.label}
          </h2>
        </div>
        {current.section && (
          <div className="flex shrink-0 gap-1">
            <IconButton label={current.section.visible ? 'Sembunyikan dari CV' : 'Tampilkan di CV'} onClick={() => toggleSection(current.section!)}>
              {current.section.visible ? <IconEye size={18} /> : <IconEyeOff size={18} />}
            </IconButton>
            <IconButton label="Hapus bagian" onClick={() => removeSection(current.section!)} className="hover:text-danger">
              <IconTrash size={18} />
            </IconButton>
          </div>
        )}
      </div>
      {current.section && !current.section.visible ? <p className="mb-4 rounded-xl bg-sunken px-3 py-2 text-xs font-semibold text-muted">Bagian ini disembunyikan dan tidak tampil di CV.</p> : null}
      {current.key === 'setup' && <SetupForm cv={cv} update={update} tpl={tpl} />}
      {current.key === 'personal' && <PersonalForm cv={cv} update={update} />}
      {current.section && <SectionForm key={current.section.id} section={current.section} onChange={updateSection(current.section.id)} />}
      <div className="mt-6 hidden gap-2 lg:flex">
        <Button onClick={() => go(items[index - 1]?.key)} disabled={index <= 0}>
          Sebelumnya
        </Button>
        <Button variant="primary" className="ml-auto" onClick={() => (index < items.length - 1 ? go(items[index + 1].key) : navigate(`/cv/${cv.id}/lihat`))}>
          {index < items.length - 1 ? `Lanjut: ${items[index + 1].label}` : 'Selesai, lihat & unduh'}
        </Button>
      </div>
    </section>
  ) : null;

  return (
    <EditorCtx.Provider value={{ lang: cv.lang, undo: ed.undo }}>
      <div ref={top} className="-mt-4 scroll-mt-0 md:-mt-8">
        <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-1 border-b border-line bg-bg/95 px-2 py-2 backdrop-blur md:-mx-8 md:px-6">
          <IconButton label={active && !wide ? 'Kembali ke daftar bagian' : 'Kembali ke daftar CV'} onClick={() => (active && !wide ? go(null) : navigate('/'))}>
            <IconBack />
          </IconButton>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight">{cv.title || name}</p>
            <SaveBadge state={ed.saveState} />
          </div>
          <IconButton label="Urungkan (Ctrl+Z)" onClick={ed.undo} disabled={!ed.canUndo}>
            <IconUndo size={19} />
          </IconButton>
          <IconButton label="Ulangi (Ctrl+Shift+Z)" onClick={ed.redo} disabled={!ed.canRedo}>
            <IconRedo size={19} />
          </IconButton>
          <div className="ml-1 hidden sm:block">
            <Button variant="primary" size="sm" onClick={() => navigate(`/cv/${cv.id}/lihat`)}>
              <IconDownload size={16} /> Unduh
            </Button>
          </div>
        </header>

        {ed.saveState === 'conflict' && (
          <div role="alert" className="mb-4 flex flex-col gap-2 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm sm:flex-row sm:items-center">
            <p className="flex-1">
              <span className="font-bold">CV ini diubah di tab atau jendela lain.</span> Pilih versi yang ingin dipakai.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={ed.reload}>
                Muat versi lain
              </Button>
              <Button size="sm" variant="primary" onClick={ed.keepMine}>
                Pakai versi ini
              </Button>
            </div>
          </div>
        )}
        {ed.saveState === 'error' && (
          <div role="alert" className="mb-4 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            Perubahan gagal disimpan. Ruang penyimpanan browser mungkin penuh atau sedang dalam mode privat. Hapus foto/CV yang tidak dipakai atau buat backup.
          </div>
        )}

        {wide ? (
          <div className={`grid items-start gap-6 ${xl ? 'grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'}`}>
            {xl ? <aside className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto custom-scrollbar">{nav}</aside> : null}
            <div className="min-w-0">
              {!xl && (
                <div className="relative mb-4">
                  <Button block onClick={() => setNavOpen((v) => !v)} aria-expanded={navOpen} className="justify-between">
                    <span className="truncate">{current?.label ?? 'Pilih bagian'}</span>
                    <IconChevronDown size={18} className={navOpen ? 'rotate-180' : ''} />
                  </Button>
                  {navOpen && <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-[70dvh] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-xl">{nav}</div>}
                </div>
              )}
              {panel}
            </div>
            <div className="sticky top-20">
              <PdfPreview blob={pdf.blob} busy={pdf.busy} error={pdf.error} />
            </div>
          </div>
        ) : (
          <>
            {panel ?? (
              <div>
                <p className="mb-3 text-sm text-muted">Isi tiap bagian, lalu lihat pratinjau dan unduh. Semua perubahan tersimpan otomatis.</p>
                {nav}
              </div>
            )}
            <div className="fixed inset-x-0 bottom-0 z-30 md:left-[var(--sidebar-w)] flex gap-2 border-t border-line bg-surface/95 px-3 pt-2.5 pb-safe backdrop-blur-md">
              {current ? (
                <>
                  <Button onClick={() => go(items[index - 1]?.key ?? null)} aria-label="Bagian sebelumnya" className="px-3">
                    ‹
                  </Button>
                  <Button onClick={() => setPreviewOpen(true)} className="flex-1">
                    <IconEye size={18} /> Pratinjau
                  </Button>
                  <Button variant="primary" onClick={() => (index < items.length - 1 ? go(items[index + 1].key) : navigate(`/cv/${cv.id}/lihat`))} className="flex-1">
                    {index < items.length - 1 ? 'Lanjut ›' : 'Selesai'}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setPreviewOpen(true)} className="flex-1">
                    <IconEye size={18} /> Pratinjau
                  </Button>
                  <Button variant="primary" onClick={() => navigate(`/cv/${cv.id}/lihat`)} className="flex-1">
                    <IconDownload size={18} /> Unduh
                  </Button>
                </>
              )}
            </div>
            <Sheet
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              title="Pratinjau"
              size="full"
              actions={
                <Button size="sm" variant="primary" onClick={() => navigate(`/cv/${cv.id}/lihat`)}>
                  <IconDownload size={16} /> Unduh
                </Button>
              }
            >
              <PdfPreview blob={pdf.blob} busy={pdf.busy} error={pdf.error} />
            </Sheet>
          </>
        )}
        <AddSectionSheet open={adding} onClose={() => setAdding(false)} cv={cv} onAdd={addSection} />
      </div>
    </EditorCtx.Provider>
  );
}
