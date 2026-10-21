import { useId, useState } from 'react';
import type { Cv, CvLink, LinkKind, Personal } from '../types';
import { Button, Field, Select, TextArea, TextInput, useUI } from '../components/ui';
import { IconCamera, IconPlus, IconTrash, IconUser } from '../components/icons';
import { PhotoCropper } from '../components/PhotoCropper';
import { putAsset, releaseAsset } from '../db';
import { useAsset } from '../hooks';
import { uid } from '../lib/id';
import { guessKind, isEmail, isValidUrl, LINK_NAMES, normalizePhone, phoneHasCountryCode } from '../lib/contact';
import { normalizeText, splitList } from '../lib/text';
import { todayISO } from '../lib/id';
import { digitsOnly, GENDERS, LICENSES, MARITAL, NATIONALITIES, RELIGIONS } from '../presets/personal';
import { countryPreset } from '../presets/countries';

type Update = (fn: (c: Cv) => Cv, key?: string) => void;

function useField(cv: Cv, update: Update) {
  const base = useId();
  return (
    key: keyof Personal,
    label: string,
    opts: {
      placeholder?: string;
      type?: string;
      inputMode?: 'email' | 'tel' | 'text' | 'url' | 'numeric';
      hint?: string;
      error?: string | null;
      autoComplete?: string;
      onBlur?: () => void;
      filter?: (v: string) => string;
      list?: string;
      max?: string;
      suffix?: string;
    } = {},
  ) => (
    <Field label={label} htmlFor={`${base}-${key}`} hint={opts.error ? <span className="font-semibold text-danger">{opts.error}</span> : opts.hint}>
      <div className="relative">
        <TextInput
          id={`${base}-${key}`}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          autoComplete={opts.autoComplete}
          list={opts.list}
          max={opts.max}
          value={cv.personal[key] as string}
          placeholder={opts.placeholder}
          aria-invalid={!!opts.error}
          onBlur={opts.onBlur}
          className={opts.suffix ? 'pr-11' : ''}
          onChange={(e) => {
            const raw = normalizeText(e.target.value);
            const v = opts.filter ? opts.filter(raw) : raw;
            update((c) => ({ ...c, personal: { ...c.personal, [key]: v } }), `personal.${key}`);
          }}
        />
        {opts.suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">{opts.suffix}</span>}
      </div>
    </Field>
  );
}

function PhotoField({ cv, update }: { cv: Cv; update: Update }) {
  const photo = useAsset(cv.photoId);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useUI();
  const inputId = useId();
  const preset = countryPreset(cv.country);
  const save = async (data: string) => {
    setFile(null);
    try {
      const id = await putAsset('photo', data);
      const old = cv.photoId;
      update((c) => ({ ...c, photoId: id, options: { ...c.options, showPhoto: true } }));
      if (old && old !== id) setTimeout(() => releaseAsset(old), 1500);
    } catch {
      toast('Foto gagal disimpan. Ruang penyimpanan browser mungkin penuh.', 'error');
    }
  };
  const remove = () => {
    const old = cv.photoId;
    update((c) => ({ ...c, photoId: undefined }));
    if (old) setTimeout(() => releaseAsset(old), 1500);
  };
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-28 w-21 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-sunken">
        {photo ? <img src={photo} alt="Foto CV" className="size-full object-cover" /> : <IconUser size={32} className="text-muted" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Foto</p>
        <p className="text-xs text-muted">
          {preset.photo === 'avoid'
            ? `CV untuk ${preset.name} sebaiknya tanpa foto.`
            : preset.photo === 'expected'
              ? 'Pas foto formal, latar polos, wajah terlihat jelas.'
              : 'Opsional untuk negara tujuan ini.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label
            htmlFor={inputId}
            className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:bg-sunken focus-within:outline-2 focus-within:outline-[var(--focus)]"
          >
            <IconCamera size={16} /> {photo ? 'Ganti' : 'Pilih foto'}
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
                e.target.value = '';
              }}
            />
          </label>
          {photo && (
            <Button size="sm" variant="ghost" onClick={remove}>
              Hapus
            </Button>
          )}
        </div>
      </div>
      <PhotoCropper file={file} onClose={() => setFile(null)} onDone={save} initialAspect={cv.options.showPhoto ? '3x4' : 'square'} />
    </div>
  );
}

function ChoiceField({
  cv,
  update,
  field,
  label,
  options,
}: {
  cv: Cv;
  update: Update;
  field: 'gender' | 'religion' | 'maritalStatus';
  label: string;
  options: Record<string, Record<'id' | 'en', string>>;
}) {
  const id = useId();
  const value = cv.personal[field];
  const legacy = value && !options[value];
  return (
    <Field label={label} htmlFor={id}>
      <Select id={id} value={value} onChange={(e) => update((c) => ({ ...c, personal: { ...c.personal, [field]: e.target.value } }))}>
        <option value="">Tidak dicantumkan</option>
        {legacy && <option value={value}>{value}</option>}
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v.id}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function LicenseField({ cv, update }: { cv: Cv; update: Update }) {
  const owned = new Set(splitList(cv.personal.drivingLicense).map((x) => x.toUpperCase().replace(/^SIM\s*/, '')));
  const toggle = (l: string) => {
    const next = new Set(owned);
    if (next.has(l)) next.delete(l);
    else next.add(l);
    update((c) => ({ ...c, personal: { ...c.personal, drivingLicense: LICENSES.filter((x) => next.has(x)).join(', ') } }));
  };
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-semibold">SIM yang dimiliki</legend>
      <div className="flex flex-wrap gap-1.5">
        {LICENSES.map((l) => (
          <button
            key={l}
            type="button"
            role="checkbox"
            aria-checked={owned.has(l)}
            onClick={() => toggle(l)}
            className={`min-h-10 min-w-12 rounded-xl border px-3 text-sm font-bold ${owned.has(l) ? 'border-brand bg-brand-soft text-text' : 'border-line bg-surface text-muted hover:bg-sunken'}`}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const KINDS: LinkKind[] = ['linkedin', 'portfolio', 'github', 'website', 'behance', 'dribbble', 'instagram', 'youtube', 'tiktok', 'other'];

function LinksField({ cv, update }: { cv: Cv; update: Update }) {
  const setLinks = (fn: (l: CvLink[]) => CvLink[], key = '') => update((c) => ({ ...c, personal: { ...c.personal, links: fn(c.personal.links) } }), key);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold">Tautan</p>
      {cv.personal.links.map((l) => {
        const bad = l.url.trim() && !l.url.trim().startsWith('@') && !isValidUrl(l.url);
        return (
          <div key={l.id} className="flex flex-col gap-1">
            <div className="grid grid-cols-[8.5rem_1fr_auto] gap-2">
              <Select aria-label="Jenis tautan" value={l.kind} onChange={(e) => setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, kind: e.target.value as LinkKind } : x)))}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {LINK_NAMES[k]}
                  </option>
                ))}
              </Select>
              <TextInput
                aria-label={`Alamat ${LINK_NAMES[l.kind]}`}
                inputMode="url"
                autoCapitalize="off"
                placeholder={l.kind === 'linkedin' ? 'linkedin.com/in/nama' : 'alamat tautan'}
                value={l.url}
                onChange={(e) => {
                  const url = e.target.value.trim();
                  setLinks((ls) => ls.map((x) => (x.id === l.id ? { ...x, url, kind: x.kind === 'other' || x.kind === 'website' ? (guessKind(url) ?? x.kind) : x.kind } : x)), `link.${l.id}`);
                }}
              />
              <button
                type="button"
                aria-label="Hapus tautan"
                onClick={() => setLinks((ls) => ls.filter((x) => x.id !== l.id))}
                className="inline-grid size-11 place-items-center rounded-xl text-muted hover:bg-sunken hover:text-danger"
              >
                <IconTrash size={17} />
              </button>
            </div>
            {bad ? <p className="text-xs font-semibold text-danger">Alamat tautan sepertinya belum benar.</p> : null}
          </div>
        );
      })}
      <Button
        size="sm"
        variant="ghost"
        className="self-start"
        onClick={() => setLinks((ls) => [...ls, { id: uid(), kind: ls.some((x) => x.kind === 'linkedin') ? 'portfolio' : 'linkedin', url: '', label: '' }])}
      >
        <IconPlus size={16} /> Tambah tautan
      </Button>
    </div>
  );
}

export function PersonalForm({ cv, update }: { cv: Cv; update: Update }) {
  const field = useField(cv, update);
  const p = cv.personal;
  const flags = cv.options.personal;
  const abroad = cv.country !== 'ID';
  const emailError = p.email.trim() && !isEmail(p.email) ? 'Format email belum benar.' : null;
  const phoneHint = abroad && p.phone.trim() && !phoneHasCountryCode(p.phone) ? 'Untuk CV luar negeri, awali dengan kode negara (+62).' : 'Nomor yang aktif di WhatsApp.';
  const addressId = useId();
  return (
    <div className="flex flex-col gap-5">
      <PhotoField cv={cv} update={update} />
      <div className="grid gap-3 sm:grid-cols-[7rem_1fr_7rem]">
        {field('prefix', 'Gelar depan', { placeholder: 'dr., Ir.' })}
        {field('fullName', 'Nama lengkap', { placeholder: 'Nama sesuai KTP / ijazah', autoComplete: 'name' })}
        {field('suffix', 'Gelar belakang', { placeholder: 'S.Kom.' })}
      </div>
      {field('headline', 'Jabatan / judul profil', { placeholder: 'Fresh Graduate Akuntansi', hint: 'Satu baris singkat di bawah nama.' })}
      <div className="grid gap-3 sm:grid-cols-2">
        {field('email', 'Email', { type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'nama@gmail.com', error: emailError })}
        {field('phone', 'Nomor HP', {
          type: 'tel',
          inputMode: 'tel',
          autoComplete: 'tel',
          placeholder: '0812-3456-7890',
          hint: phoneHint,
          filter: (v) => v.replace(/[^\d+\-()\s]/g, '').slice(0, 20),
          onBlur: () => abroad && update((c) => ({ ...c, personal: { ...c.personal, phone: normalizePhone(c.personal.phone) } })),
        })}
        {field('city', 'Kota domisili', { placeholder: 'Malang', autoComplete: 'address-level2' })}
        {field('region', 'Provinsi', { placeholder: 'Jawa Timur', autoComplete: 'address-level1' })}
        {abroad ? field('country', 'Negara', { placeholder: 'Indonesia', autoComplete: 'country-name' }) : null}
      </div>
      <LinksField cv={cv} update={update} />

      <div className="flex flex-col gap-3 rounded-2xl border border-line p-3 sm:p-4">
        <div>
          <p className="text-sm font-bold">Data pribadi</p>
          <p className="text-xs text-muted">Hanya yang dicentang di Pengaturan CV yang tampil. NIK dan nomor KTP sebaiknya tidak dicantumkan.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('birthPlace', 'Tempat lahir', { placeholder: 'Malang' })}
          {field('birthDate', 'Tanggal lahir', { type: 'date', max: todayISO() })}
          <ChoiceField cv={cv} update={update} field="gender" label="Jenis kelamin" options={GENDERS} />
          <ChoiceField cv={cv} update={update} field="maritalStatus" label="Status pernikahan" options={MARITAL} />
          <ChoiceField cv={cv} update={update} field="religion" label="Agama" options={RELIGIONS} />
          {field('nationality', 'Kewarganegaraan', { placeholder: 'Indonesia', list: 'cv-nationalities' })}
          {field('height', 'Tinggi badan', { inputMode: 'numeric', filter: (v) => digitsOnly(v), suffix: 'cm', placeholder: '165' })}
          {field('weight', 'Berat badan', { inputMode: 'numeric', filter: (v) => digitsOnly(v), suffix: 'kg', placeholder: '55' })}
        </div>
        <datalist id="cv-nationalities">
          {NATIONALITIES.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <LicenseField cv={cv} update={update} />
        <Field label="Alamat lengkap" htmlFor={addressId}>
          <TextArea id={addressId} value={p.address} onChange={(e) => update((c) => ({ ...c, personal: { ...c.personal, address: normalizeText(e.target.value) } }), 'personal.address')} />
        </Field>
        {!Object.values(flags).some(Boolean) && <p className="text-xs text-muted">Semua data pribadi sedang disembunyikan dari CV.</p>}
      </div>
    </div>
  );
}
