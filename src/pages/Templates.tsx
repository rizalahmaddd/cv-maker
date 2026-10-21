import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout';
import { Button, Loading, Segmented, Sheet, useUI } from '../components/ui';
import { TemplateThumb } from '../components/TemplateThumb';
import { createCv, db, patchCv } from '../db';
import { useAllTemplates } from '../hooks';
import { CATEGORIES, copyOfTemplate, layoutMeta, parseTemplateFile } from '../templates';
import { IconUpload } from '../components/icons';
import { downloadFile, safeFileName } from '../lib/files';
import { AtsBadge } from '../editor/SetupForm';
import type { Lang, TemplateConfig } from '../types';

export function Templates() {
  const templates = useAllTemplates();
  const cvs = useLiveQuery(() => db.cvs.orderBy('updatedAt').reverse().toArray(), []);
  const navigate = useNavigate();
  const { toast } = useUI();
  const [cat, setCat] = useState('all');
  const [lang, setLang] = useState<Lang>('id');
  const [picked, setPicked] = useState<TemplateConfig | null>(null);
  const importId = useId();

  if (!templates) return <Loading />;
  const shown = templates.filter((t) => cat === 'all' || layoutMeta(t.layout).category === cat);

  const applyTo = async (cvId: string) => {
    if (!picked) return;
    await patchCv(cvId, (c) => ({ ...c, templateId: picked.id }));
    setPicked(null);
    toast(`Template ${picked.name} dipakai.`, 'ok', { label: 'Buka CV', onClick: () => navigate(`/cv/${cvId}`) });
  };

  const customize = async () => {
    if (!picked) return;
    if (picked.builtin) {
      const copy = copyOfTemplate(picked);
      await db.templates.put(copy);
      navigate(`/template/${copy.id}`);
    } else navigate(`/template/${picked.id}`);
  };

  const exportTemplate = (t: TemplateConfig) => {
    const { createdAt: _c, updatedAt: _u, ...rest } = t;
    downloadFile(new File([JSON.stringify(rest, null, 2)], safeFileName(`template-${t.name}.json`), { type: 'application/json' }));
  };

  const importTemplate = async (f: File) => {
    try {
      const t = parseTemplateFile(await f.text());
      await db.templates.put(t);
      toast(`Template "${t.name}" ditambahkan.`, 'ok', { label: 'Buka', onClick: () => navigate(`/template/${t.id}`) });
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const createWith = async () => {
    if (!picked) return;
    const cv = await createCv({ templateId: picked.id });
    navigate(`/cv/${cv.id}`, { state: { fresh: true } });
  };

  return (
    <div>
      <PageHeader
        title="Template"
        sub={`${templates.length} template. Ketuk untuk memakai atau menyesuaikan.`}
        actions={
          <label
            htmlFor={importId}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:bg-sunken focus-within:outline-2 focus-within:outline-[var(--focus)]"
          >
            <IconUpload size={18} /> Impor
            <input
              id={importId}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) importTemplate(f);
              }}
            />
          </label>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[{ key: 'all', name: 'Semua', hint: '' }, ...CATEGORIES].map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.hint}
              onClick={() => setCat(c.key)}
              className={`min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold ${cat === c.key ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:text-text'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-56">
          <Segmented<Lang>
            label="Bahasa contoh"
            value={lang}
            onChange={setLang}
            options={[
              { value: 'id', label: 'Indonesia' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((t) => (
          <li key={t.id} className="min-w-0">
            <button type="button" onClick={() => setPicked(t)} className="w-full rounded-2xl border border-line bg-surface p-2 text-left transition-shadow hover:shadow-md">
              <TemplateThumb tpl={t} alt={`Template ${t.name}`} lang={lang} />
              <span className="mt-2 flex items-center justify-between gap-1 px-0.5">
                <span className="truncate text-sm font-bold">
                  {t.name}
                  {!t.builtin && <span className="ml-1 text-xs font-semibold text-brand">· milik saya</span>}
                </span>
                <AtsBadge tpl={t} />
              </span>
              <span className="mt-0.5 line-clamp-2 block px-0.5 text-xs text-muted">{layoutMeta(t.layout).hint}</span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={!!picked} onClose={() => setPicked(null)} title={picked ? `Template ${picked.name}` : ''} size="lg">
        {picked && (
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
            <TemplateThumb tpl={picked} alt={`Template ${picked.name}`} lang={lang} />
            <div className="flex flex-col gap-3">
              <div>
                <AtsBadge tpl={picked} />
                <p className="mt-2 text-sm text-muted">{layoutMeta(picked.layout).hint}.</p>
              </div>
              <Button variant="primary" onClick={createWith}>
                Buat CV baru dengan template ini
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={customize}>{picked.builtin ? 'Sesuaikan warna & gaya' : 'Edit template'}</Button>
                <Button onClick={() => exportTemplate(picked)}>Ekspor</Button>
              </div>
              {cvs?.length ? (
                <div>
                  <p className="mb-2 text-sm font-bold">Atau pakai untuk CV yang ada</p>
                  <ul className="flex flex-col gap-1.5">
                    {cvs.map((c) => (
                      <li key={c.id}>
                        <Button block className="justify-start" onClick={() => applyTo(c.id)}>
                          <span className="truncate">{c.title || c.personal.fullName || 'Tanpa nama'}</span>
                          {c.templateId === picked.id ? <span className="ml-auto text-xs text-muted">dipakai</span> : null}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
