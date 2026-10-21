import { useId, useState } from 'react';
import type { CountryKey, Cv, DateFormat, Lang, PersonalFlag, TemplateConfig } from '../types';
import { Button, Field, Segmented, Select, Sheet, TextInput, Toggle } from '../components/ui';
import { TemplateThumb } from '../components/TemplateThumb';
import { useAllTemplates } from '../hooks';
import { COUNTRIES, countryPreset, optionsForCountry } from '../presets/countries';
import { PERSONAL_FLAG_NAMES } from '../lib/labels';
import { formatYM } from '../lib/dates';
import { CATEGORIES, layoutMeta, templateAts } from '../templates';

type Update = (fn: (c: Cv) => Cv, key?: string) => void;

export function AtsBadge({ tpl }: { tpl: TemplateConfig }) {
  const ats = templateAts(tpl);
  const meta = {
    safe: { label: 'Siap ATS', cls: 'bg-ok/12 text-ok border-ok/30' },
    partial: { label: 'Cukup ATS', cls: 'bg-warn/12 text-warn border-warn/30' },
    unsafe: { label: 'Kurang ATS', cls: 'bg-danger/10 text-danger border-danger/30' },
  }[ats];
  return <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${meta.cls}`}>{meta.label}</span>;
}

export function TemplatePicker({ open, onClose, value, onPick, lang }: { open: boolean; onClose: () => void; value: string; onPick: (id: string) => void; lang: Lang }) {
  const templates = useAllTemplates();
  const [cat, setCat] = useState<string>('all');
  const shown = (templates ?? []).filter((t) => cat === 'all' || layoutMeta(t.layout).category === cat);
  return (
    <Sheet open={open} onClose={onClose} title="Pilih template" size="lg">
      <div className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1">
        {[{ key: 'all', name: 'Semua' }, ...CATEGORIES].map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCat(c.key)}
            className={`min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-semibold ${cat === c.key ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:text-text'}`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                onPick(t.id);
                onClose();
              }}
              aria-pressed={t.id === value}
              className={`w-full rounded-xl border-2 p-1.5 text-left transition-colors ${t.id === value ? 'border-brand' : 'border-transparent hover:border-line'}`}
            >
              <TemplateThumb tpl={t} alt={`Template ${t.name}`} lang={lang} />
              <span className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
                <span className="truncate text-sm font-bold">{t.name}</span>
                <AtsBadge tpl={t} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

const FLAGS: PersonalFlag[] = ['birth', 'gender', 'nationality', 'religion', 'marital', 'body', 'license', 'address'];

export function SetupForm({ cv, update, tpl }: { cv: Cv; update: Update; tpl: TemplateConfig | undefined }) {
  const [picker, setPicker] = useState(false);
  const base = useId();
  const preset = countryPreset(cv.country);
  const set = <K extends keyof Cv>(k: K, v: Cv[K], key = `cv.${String(k)}`) => update((c) => ({ ...c, [k]: v }), key);
  const setOpt = <K extends keyof Cv['options']>(k: K, v: Cv['options'][K]) => update((c) => ({ ...c, options: { ...c.options, [k]: v } }));
  const sensitive = (f: PersonalFlag) => preset.photo === 'avoid' && ['birth', 'gender', 'religion', 'marital', 'body'].includes(f);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama CV (hanya untuk Anda)" htmlFor={`${base}-title`} hint="Misalnya: CV Admin – PT ABC">
          <TextInput id={`${base}-title`} value={cv.title} onChange={(e) => set('title', e.target.value)} placeholder={cv.personal.fullName || 'CV utama'} />
        </Field>
        <Field label="Posisi yang dilamar" htmlFor={`${base}-role`}>
          <TextInput id={`${base}-role`} value={cv.targetRole} onChange={(e) => set('targetRole', e.target.value)} placeholder="Staff Administrasi" />
        </Field>
        <Field label="Perusahaan tujuan" htmlFor={`${base}-company`} hint="Opsional, untuk nama file dan surat lamaran.">
          <TextInput id={`${base}-company`} value={cv.targetCompany} onChange={(e) => set('targetCompany', e.target.value)} placeholder="PT Contoh Jaya" />
        </Field>
        <Field label="Negara tujuan" htmlFor={`${base}-country`}>
          <Select
            id={`${base}-country`}
            value={cv.country}
            onChange={(e) => {
              const country = e.target.value as CountryKey;
              update((c) => ({ ...c, country, options: { ...c.options, ...optionsForCountry(country) } }));
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="-mt-2 rounded-xl bg-sunken px-3 py-2.5 text-xs leading-relaxed text-muted">{preset.tip}</p>

      <Field label="Bahasa CV" hint="Mengubah judul bagian dan format tanggal. Isi tulisan Anda tidak diterjemahkan.">
        <Segmented<Lang>
          label="Bahasa CV"
          value={cv.lang}
          onChange={(v) => set('lang', v)}
          options={[
            { value: 'id', label: 'Bahasa Indonesia' },
            { value: 'en', label: 'English' },
          ]}
        />
      </Field>

      <div className="flex items-center gap-3 rounded-2xl border border-line p-3">
        <div className="w-16 shrink-0">{tpl ? <TemplateThumb tpl={tpl} alt={`Template ${tpl.name}`} lang={cv.lang} /> : null}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Template</p>
          <p className="truncate text-sm font-bold">{tpl?.name}</p>
          {tpl ? <AtsBadge tpl={tpl} /> : null}
        </div>
        <Button onClick={() => setPicker(true)}>Ganti</Button>
      </div>
      <TemplatePicker open={picker} onClose={() => setPicker(false)} value={cv.templateId} onPick={(id) => set('templateId', id)} lang={cv.lang} />

      <div className="flex flex-col gap-1 rounded-2xl border border-line p-3 sm:p-4">
        <Toggle
          checked={cv.options.showPhoto}
          onChange={(v) => setOpt('showPhoto', v)}
          label="Tampilkan foto"
          hint={tpl && !layoutMeta(tpl.layout).photo ? 'Template ini tidak memakai foto.' : preset.photo === 'avoid' ? `Tidak disarankan untuk ${preset.name}.` : undefined}
        />
        <Toggle checked={cv.options.fitOnePage} onChange={(v) => setOpt('fitOnePage', v)} label="Muat dalam 1 halaman" hint="Huruf dan jarak dikecilkan sedikit bila isi melewati 1 halaman." />
        <Toggle checked={cv.options.showQr} onChange={(v) => setOpt('showQr', v)} label="Kode QR ke LinkedIn / portofolio" hint="Hanya tampil di template Modern dan Sidebar." />
        {cv.options.showQr && (
          <Field label="Tautan untuk QR" htmlFor={`${base}-qr`} hint="Kosongkan untuk memakai tautan pertama di data diri.">
            <TextInput id={`${base}-qr`} inputMode="url" value={cv.options.qrUrl} onChange={(e) => setOpt('qrUrl', e.target.value.trim())} placeholder="linkedin.com/in/nama" />
          </Field>
        )}
      </div>

      <fieldset className="rounded-2xl border border-line p-3 sm:p-4">
        <legend className="px-1 text-sm font-bold">Data pribadi yang ditampilkan</legend>
        <div className="mt-1 grid gap-x-4 sm:grid-cols-2">
          {FLAGS.map((f) => (
            <label key={f} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="size-4.5 accent-[var(--brand)]"
                checked={cv.options.personal[f]}
                onChange={(e) => setOpt('personal', { ...cv.options.personal, [f]: e.target.checked })}
              />
              <span>
                {PERSONAL_FLAG_NAMES[f]}
                {sensitive(f) && cv.options.personal[f] ? <span className="ml-1.5 text-xs font-semibold text-warn">tidak disarankan</span> : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Format tanggal" htmlFor={`${base}-date`}>
        <Select id={`${base}-date`} value={cv.options.dateFormat} onChange={(e) => setOpt('dateFormat', e.target.value as DateFormat)}>
          {(['short', 'long', 'numeric', 'year'] as DateFormat[]).map((f) => (
            <option key={f} value={f}>
              {formatYM({ y: 2024, m: 8 }, cv.lang, f)}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
