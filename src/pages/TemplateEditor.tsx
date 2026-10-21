import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout';
import { Button, Card, EmptyState, Field, Loading, Segmented, Select, SectionTitle, Sheet, TextInput, Toggle, useUI } from '../components/ui';
import { IconEye, IconTrash } from '../components/icons';
import { PdfPreview } from '../components/PdfPreview';
import { db, getAssetData, normalizeCv } from '../db';
import { useCvPdf, useMedia } from '../hooks';
import { sampleCv } from '../presets/sample';
import { SECTION_DEFS, SECTION_ORDER } from '../presets/sections';
import { FONT_PAIRS, FONTS, LAYOUTS, normalizeTemplate, PALETTES, PAPERS } from '../templates';
import { AtsBadge } from '../editor/SetupForm';
import type { FontKey, Lang, LayoutKey, PaperKey, TemplateConfig, TemplateStyle } from '../types';

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1" />
      <label htmlFor={id} className="min-w-0 flex-1 text-sm">
        <span className="block font-semibold">{label}</span>
        <span className="font-mono text-xs text-muted">{value}</span>
      </label>
    </div>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <Field label={label}>
      <Segmented label={label} value={value} options={options} onChange={onChange} />
    </Field>
  );
}

export function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, confirm } = useUI();
  const stored = useLiveQuery(async () => (id ? ((await db.templates.get(id)) ?? null) : null), [id]);
  const cvs = useLiveQuery(() => db.cvs.orderBy('updatedAt').reverse().toArray(), []);
  const [tpl, setTpl] = useState<TemplateConfig | null>(null);
  const [previewCv, setPreviewCv] = useState<string>('sample');
  const [lang, setLang] = useState<Lang>('id');
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const wide = useMedia('(min-width: 1024px)');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const base = useId();

  useEffect(() => {
    if (stored && !tpl) setTpl(normalizeTemplate(stored));
  }, [stored, tpl]);

  const cv = useLiveQuery(async () => {
    if (previewCv === 'sample') return { cv: sampleCv(lang, tpl?.id), photo: undefined };
    const c = await db.cvs.get(previewCv);
    return c ? { cv: normalizeCv(c), photo: (await getAssetData(c.photoId)) ?? undefined } : null;
  }, [previewCv, lang, tpl?.id]);
  const previewTarget = useMemo(() => (cv?.cv ? { ...cv.cv, options: { ...cv.cv.options, showPhoto: cv.photo ? cv.cv.options.showPhoto : false } } : null), [cv]);
  const pdf = useCvPdf(wide || previewOpen ? previewTarget : null, tpl ?? undefined, cv ? (cv.photo ?? null) : undefined, 400);

  if (stored === null)
    return (
      <EmptyState
        title="Template tidak ditemukan"
        body="Template bawaan tidak bisa diubah langsung. Buat salinannya dari halaman Template."
        action={
          <Link to="/template" className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-bg">
            Ke daftar template
          </Link>
        }
      />
    );
  if (!tpl) return <Loading />;

  const update = (fn: (t: TemplateConfig) => TemplateConfig) => {
    setTpl((t) => {
      const next = { ...fn(t!), updatedAt: Date.now() };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => db.templates.put(next), 300);
      return next;
    });
  };
  const style = <K extends keyof TemplateStyle>(k: K, v: TemplateStyle[K]) => update((t) => ({ ...t, style: { ...t.style, [k]: v } }));
  const color = (k: keyof TemplateConfig['colors']) => (v: string) => update((t) => ({ ...t, colors: { ...t.colors, [k]: v } }));
  const layout = LAYOUTS.find((l) => l.key === tpl.layout)!;

  const remove = async () => {
    const used = await db.cvs.where('templateId').equals(tpl.id).count();
    const ok = await confirm({
      title: 'Hapus template?',
      message: used ? `${used} CV memakai template ini dan akan kembali ke template Klasik.` : 'Template ini akan dihapus.',
      confirmLabel: 'Hapus',
      danger: true,
    });
    if (!ok) return;
    await db.transaction('rw', db.templates, db.cvs, async () => {
      await db.templates.delete(tpl.id);
      await db.cvs
        .where('templateId')
        .equals(tpl.id)
        .modify((c) => {
          c.templateId = 'klasik';
          c.rev = (c.rev ?? 1) + 1;
        });
    });
    toast('Template dihapus.');
    navigate('/template', { replace: true });
  };

  const preview = <PdfPreview blob={pdf.blob} busy={pdf.busy} error={pdf.error} />;

  return (
    <div>
      <PageHeader
        title={tpl.name || 'Template'}
        back="/template"
        sub={<AtsBadge tpl={tpl} />}
        actions={
          <Button variant="danger" onClick={remove}>
            <IconTrash size={18} /> Hapus
          </Button>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle>Dasar</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="Nama template" htmlFor={`${base}-name`}>
                <TextInput id={`${base}-name`} value={tpl.name} onChange={(e) => update((t) => ({ ...t, name: e.target.value }))} />
              </Field>
              <Field label="Tata letak" htmlFor={`${base}-layout`} hint={layout.hint}>
                <Select id={`${base}-layout`} value={tpl.layout} onChange={(e) => update((t) => ({ ...t, layout: e.target.value as LayoutKey }))}>
                  {LAYOUTS.map((l) => (
                    <option key={l.key} value={l.key}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ukuran kertas" htmlFor={`${base}-paper`}>
                <Select id={`${base}-paper`} value={tpl.paper} onChange={(e) => update((t) => ({ ...t, paper: e.target.value as PaperKey }))}>
                  {PAPERS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <SectionTitle>Warna</SectionTitle>
            <div className="mb-4 flex flex-wrap gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  title={p.name}
                  aria-label={`Palet ${p.name}`}
                  onClick={() => update((t) => ({ ...t, colors: { ...t.colors, primary: p.primary, accent: p.accent, side: isDarkSide(t) ? p.primary : t.colors.side } }))}
                  className="flex size-10 overflow-hidden rounded-full border-2 border-line"
                >
                  <span className="h-full w-1/2" style={{ background: p.primary }} />
                  <span className="h-full w-1/2" style={{ background: p.accent }} />
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField label="Utama" value={tpl.colors.primary} onChange={color('primary')} />
              <ColorField label="Aksen" value={tpl.colors.accent} onChange={color('accent')} />
              <ColorField label="Teks" value={tpl.colors.text} onChange={color('text')} />
              <ColorField label="Teks redup" value={tpl.colors.muted} onChange={color('muted')} />
              {tpl.layout === 'sidebar' && <ColorField label="Kolom samping" value={tpl.colors.side} onChange={color('side')} />}
              <ColorField label="Kertas" value={tpl.colors.paper} onChange={color('paper')} />
            </div>
          </Card>

          <Card>
            <SectionTitle>Huruf</SectionTitle>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {FONT_PAIRS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => update((t) => ({ ...t, fonts: { heading: p.heading, body: p.body } }))}
                  className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${tpl.fonts.heading === p.heading && tpl.fonts.body === p.body ? 'border-ink bg-ink text-bg' : 'border-line hover:bg-sunken'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['heading', 'body'] as const).map((k) => (
                <Field key={k} label={k === 'heading' ? 'Huruf judul' : 'Huruf isi'} htmlFor={`${base}-${k}`}>
                  <Select id={`${base}-${k}`} value={tpl.fonts[k]} onChange={(e) => update((t) => ({ ...t, fonts: { ...t.fonts, [k]: e.target.value as FontKey } }))}>
                    {FONTS.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
            </div>
            <Field label={`Ukuran huruf ${Math.round(tpl.style.fontScale * 100)}%`} htmlFor={`${base}-scale`} className="mt-3">
              <input
                id={`${base}-scale`}
                type="range"
                min={0.85}
                max={1.15}
                step={0.01}
                value={tpl.style.fontScale}
                onChange={(e) => style('fontScale', Number(e.target.value))}
                className="accent-[var(--brand)]"
              />
            </Field>
          </Card>

          <Card>
            <SectionTitle>Gaya</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="Judul bagian" htmlFor={`${base}-heading`}>
                <Select id={`${base}-heading`} value={tpl.style.heading} onChange={(e) => style('heading', e.target.value as TemplateStyle['heading'])}>
                  <option value="line">Garis bawah penuh</option>
                  <option value="underline">Garis aksen pendek</option>
                  <option value="block">Blok warna</option>
                  <option value="bar">Batang di kiri</option>
                  <option value="plain">Polos</option>
                </Select>
              </Field>
              <Choice
                label="Huruf judul bagian"
                value={tpl.style.headingCase}
                onChange={(v) => style('headingCase', v)}
                options={[
                  { value: 'upper', label: 'KAPITAL' },
                  { value: 'normal', label: 'Biasa' },
                ]}
              />
              <Choice
                label="Kepadatan"
                value={tpl.style.density}
                onChange={(v) => style('density', v)}
                options={[
                  { value: 'compact', label: 'Rapat' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'airy', label: 'Lega' },
                ]}
              />
              <Choice
                label="Margin"
                value={tpl.style.margin}
                onChange={(v) => style('margin', v)}
                options={[
                  { value: 'narrow', label: 'Sempit' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'wide', label: 'Lebar' },
                ]}
              />
              <Choice
                label="Posisi tanggal"
                value={tpl.style.datePosition === 'left' ? 'right' : tpl.style.datePosition}
                onChange={(v) => style('datePosition', v)}
                options={[
                  { value: 'right', label: 'Kanan' },
                  { value: 'below', label: 'Di bawah judul' },
                ]}
              />
              <Field
                label="Tampilan keahlian & bahasa"
                htmlFor={`${base}-skills`}
                hint={tpl.style.skills === 'bars' || tpl.style.skills === 'dots' ? 'Grafik level kurang terbaca oleh sistem ATS.' : undefined}
              >
                <Select id={`${base}-skills`} value={tpl.style.skills} onChange={(e) => style('skills', e.target.value as TemplateStyle['skills'])}>
                  <option value="text">Teks dipisah koma</option>
                  <option value="tags">Label kotak</option>
                  <option value="dots">Titik level</option>
                  <option value="bars">Batang level</option>
                </Select>
              </Field>
              {layout.photo && (
                <Choice
                  label="Bentuk foto"
                  value={tpl.style.photoShape}
                  onChange={(v) => style('photoShape', v)}
                  options={[
                    { value: 'square', label: 'Kotak' },
                    { value: 'rounded', label: 'Tumpul' },
                    { value: 'circle', label: 'Bulat' },
                  ]}
                />
              )}
              {tpl.layout === 'klasik' && (
                <Choice
                  label="Posisi kepala"
                  value={tpl.style.headerAlign}
                  onChange={(v) => style('headerAlign', v)}
                  options={[
                    { value: 'left', label: 'Kiri' },
                    { value: 'center', label: 'Tengah' },
                  ]}
                />
              )}
              {tpl.layout === 'sidebar' && (
                <Field label={`Lebar kolom samping ${tpl.style.sideWidth}%`} htmlFor={`${base}-side`}>
                  <input
                    id={`${base}-side`}
                    type="range"
                    min={26}
                    max={40}
                    step={1}
                    value={tpl.style.sideWidth}
                    onChange={(e) => style('sideWidth', Number(e.target.value))}
                    className="accent-[var(--brand)]"
                  />
                </Field>
              )}
              <Toggle checked={tpl.style.icons} onChange={(v) => style('icons', v)} label="Ikon kontak" hint="Ikon kecil di samping email, telepon, dan tautan." />
              <Button onClick={() => setLabelsOpen(true)}>Ubah judul bagian</Button>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6">
          <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
            <Select aria-label="CV untuk pratinjau" value={previewCv} onChange={(e) => setPreviewCv(e.target.value)}>
              <option value="sample">Contoh CV</option>
              {cvs?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.personal.fullName || 'Tanpa nama'}
                </option>
              ))}
            </Select>
            {previewCv === 'sample' && (
              <div className="w-36">
                <Segmented<Lang>
                  label="Bahasa"
                  value={lang}
                  onChange={setLang}
                  options={[
                    { value: 'id', label: 'ID' },
                    { value: 'en', label: 'EN' },
                  ]}
                />
              </div>
            )}
          </div>
          {wide ? preview : null}
        </div>
      </div>

      {!wide && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-30 md:left-[var(--sidebar-w)] border-t border-line bg-surface/95 px-3 pt-2.5 pb-safe backdrop-blur-md">
            <Button variant="primary" block onClick={() => setPreviewOpen(true)}>
              <IconEye size={18} /> Pratinjau
            </Button>
          </div>
          <Sheet open={previewOpen} onClose={() => setPreviewOpen(false)} title="Pratinjau" size="full">
            {preview}
          </Sheet>
        </>
      )}

      <Sheet open={labelsOpen} onClose={() => setLabelsOpen(false)} title="Judul bagian" size="lg">
        <p className="mb-4 text-sm text-muted">
          Ganti judul bawaan, misalnya "Pengalaman Kerja" menjadi "Riwayat Pekerjaan". Kosongkan untuk memakai judul bawaan. Judul yang diisi per CV tetap diutamakan.
        </p>
        <div className="flex flex-col gap-2">
          {SECTION_ORDER.map((type) => (
            <div key={type} className="grid grid-cols-2 gap-2">
              {(['id', 'en'] as const).map((l) => (
                <TextInput
                  key={l}
                  aria-label={`${SECTION_DEFS[type].name.id} (${l})`}
                  placeholder={SECTION_DEFS[type].name[l]}
                  value={tpl.labels[l][type] ?? ''}
                  onChange={(e) => update((t) => ({ ...t, labels: { ...t.labels, [l]: { ...t.labels[l], [type]: e.target.value } } }))}
                />
              ))}
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function isDarkSide(t: TemplateConfig) {
  return t.colors.side.toLowerCase() === t.colors.primary.toLowerCase();
}
