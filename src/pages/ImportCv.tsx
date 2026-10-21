import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout';
import { Button, Card, Field, Segmented, Select, SectionTitle, TextArea, TextInput, useUI } from '../components/ui';
import { IconUpload } from '../components/icons';
import { createCv, db, emptyPersonal, normalizeCv } from '../db';
import { importBackup, readBackup } from '../lib/backup';
import { COUNTRIES, countryPreset } from '../presets/countries';
import { SECTION_DEFS } from '../presets/sections';
import { uid } from '../lib/id';
import type { CountryKey, Cv, Lang } from '../types';
import type { ParsedCv } from '../import/parse';

type Stage = { kind: 'pick' } | { kind: 'review'; parsed: ParsedCv; from: string };

function guessLang(p: ParsedCv): Lang {
  const text = [p.personal.headline ?? '', ...p.sections.map((s) => s.text + s.entries.map((e) => e.title + e.details).join(' '))].join(' ').toLowerCase();
  const id = text.match(/\b(dan|yang|dengan|untuk|di|sebagai|mengelola)\b/g)?.length ?? 0;
  const en = text.match(/\b(and|the|with|for|managed|led|of)\b/g)?.length ?? 0;
  return en > id * 1.5 ? 'en' : 'id';
}

export function ImportCv() {
  const navigate = useNavigate();
  const { toast, confirm } = useUI();
  const [stage, setStage] = useState<Stage>({ kind: 'pick' });
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [country, setCountry] = useState<CountryKey>('ID');
  const [lang, setLang] = useState<Lang>('id');
  const fileId = useId();

  const review = (parsed: ParsedCv, from: string) => {
    setSkip(new Set());
    const l = guessLang(parsed);
    setLang(l);
    setCountry(l === 'en' ? 'INTL' : 'ID');
    setStage({ kind: 'review', parsed, from });
  };

  const createFromCv = async (cv: Cv) => {
    const c = normalizeCv({ ...cv, id: uid(), rev: 1, createdAt: Date.now(), updatedAt: Date.now(), photoId: undefined });
    await db.cvs.add(c);
    toast('CV berhasil diimpor.');
    navigate(`/cv/${c.id}`, { replace: true });
  };

  const handleFile = async (f: File) => {
    setBusy(true);
    try {
      if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
        const { extractPdfText } = await import('../import/pdftext');
        const { parseResumeText } = await import('../import/parse');
        const { lines, linkedin } = await extractPdfText(f);
        review(parseResumeText(lines, linkedin), linkedin ? 'PDF LinkedIn' : 'PDF');
      } else if (/\.json$/i.test(f.name) || f.type === 'application/json') {
        const text = await f.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('File JSON tidak valid.');
        }
        if ((data as { app?: string })?.app === 'cv-maker') {
          const b = await readBackup(f);
          const ok = await confirm({ title: 'Ini file backup', message: `Berisi ${b.cvs.length} CV. Gabungkan dengan data di perangkat ini?`, confirmLabel: 'Gabungkan' });
          if (!ok) return;
          await importBackup(b, 'merge');
          toast('Backup dipulihkan.');
          navigate('/', { replace: true });
          return;
        }
        const { fromJsonResume } = await import('../export/jsonresume');
        await createFromCv(fromJsonResume(data));
      } else if (/\.(txt|md)$/i.test(f.name) || f.type.startsWith('text/')) {
        const { parseResumeText } = await import('../import/parse');
        review(parseResumeText(await f.text()), 'teks');
      } else if (/\.docx?$/i.test(f.name)) {
        throw new Error('File Word belum bisa dibaca langsung. Simpan sebagai PDF dari Word, atau salin semua teksnya lalu tempel di kotak di bawah.');
      } else throw new Error('Format file belum didukung. Gunakan PDF, JSON, atau teks.');
    } catch (e) {
      toast((e as Error).message || 'File gagal dibaca.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePaste = async () => {
    const { parseResumeText } = await import('../import/parse');
    review(parseResumeText(paste), 'teks tempel');
  };

  if (stage.kind === 'review') {
    const { parsed } = stage;
    const p = parsed.personal;
    const setP = (k: 'fullName' | 'email' | 'phone' | 'headline', v: string) => setStage({ ...stage, parsed: { ...parsed, personal: { ...p, [k]: v } } });
    const create = async () => {
      setBusy(true);
      const sections = parsed.sections.filter((s) => !skip.has(s.id));
      const cv = await createCv({
        country,
        lang,
        templateId: countryPreset(country).templateId,
        title: p.fullName ? `${p.fullName} (impor)` : 'CV impor',
        personal: { ...emptyPersonal(), ...p },
        sections,
      });
      navigate(`/cv/${cv.id}`, { replace: true });
    };
    return (
      <div>
        <PageHeader title="Periksa hasil impor" sub={`Dibaca dari ${stage.from}. Periksa lalu lengkapi di editor.`} back />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle>Data diri</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nama" htmlFor="im-name">
                <TextInput id="im-name" value={p.fullName ?? ''} onChange={(e) => setP('fullName', e.target.value)} />
              </Field>
              <Field label="Judul profil" htmlFor="im-head">
                <TextInput id="im-head" value={p.headline ?? ''} onChange={(e) => setP('headline', e.target.value)} />
              </Field>
              <Field label="Email" htmlFor="im-email">
                <TextInput id="im-email" value={p.email ?? ''} onChange={(e) => setP('email', e.target.value)} />
              </Field>
              <Field label="Nomor HP" htmlFor="im-phone">
                <TextInput id="im-phone" value={p.phone ?? ''} onChange={(e) => setP('phone', e.target.value)} />
              </Field>
            </div>
            {p.links?.length ? <p className="mt-3 text-xs text-muted">Tautan: {p.links.map((l) => l.url).join(', ')}</p> : null}
          </Card>
          <Card className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <SectionTitle>Bagian yang ditemukan</SectionTitle>
            {parsed.sections.length === 0 ? (
              <p className="text-sm text-muted">Tidak ada bagian yang dikenali. CV tetap bisa dibuat lalu diisi manual.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {parsed.sections.map((s) => (
                  <li key={s.id} className="py-2.5">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 size-4.5 accent-[var(--brand)]"
                        checked={!skip.has(s.id)}
                        onChange={(e) => {
                          const next = new Set(skip);
                          if (e.target.checked) next.delete(s.id);
                          else next.add(s.id);
                          setSkip(next);
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">
                          {SECTION_DEFS[s.type].name.id} {s.entries.length ? <span className="font-normal text-muted">· {s.entries.length} isian</span> : null}
                        </span>
                        <span className="line-clamp-2 block text-xs text-muted">{s.text || s.entries.map((e) => [e.title, e.subtitle].filter(Boolean).join(' – ')).join(' · ')}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {parsed.unassigned.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold text-muted">{parsed.unassigned.length} baris tidak dikenali</summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-sunken p-3 text-xs whitespace-pre-wrap">{parsed.unassigned.join('\n')}</pre>
              </details>
            )}
          </Card>
          <Card>
            <SectionTitle>Tujuan CV</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Negara tujuan" htmlFor="im-country">
                <Select id="im-country" value={country} onChange={(e) => setCountry(e.target.value as CountryKey)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Bahasa CV">
                <Segmented<Lang>
                  label="Bahasa CV"
                  value={lang}
                  onChange={setLang}
                  options={[
                    { value: 'id', label: 'Indonesia' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </Field>
            </div>
          </Card>
          <p className="text-xs text-muted lg:col-span-2">Impor membaca teks secara otomatis dan bisa keliru, terutama pada CV dua kolom. Periksa tanggal, jabatan, dan nama perusahaan di editor.</p>
          <div className="flex gap-2 lg:col-span-2 lg:justify-end">
            <Button onClick={() => setStage({ kind: 'pick' })}>Ulangi</Button>
            <Button variant="primary" className="flex-1 lg:flex-none lg:min-w-60" onClick={create} disabled={busy}>
              Buat CV dari hasil ini
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Impor CV" back="/" sub="Pindahkan CV lama ke sini tanpa mengetik ulang" />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Dari file</SectionTitle>
          <p className="mb-3 text-sm text-muted">PDF CV lama, PDF profil LinkedIn (menu Lainnya → Simpan ke PDF), JSON Resume, atau file backup aplikasi ini.</p>
          <label
            htmlFor={fileId}
            className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line p-4 text-center hover:bg-sunken focus-within:outline-2 focus-within:outline-[var(--focus)] ${busy ? 'pointer-events-none opacity-60' : ''}`}
          >
            <IconUpload size={22} />
            <span className="text-sm font-bold">{busy ? 'Membaca file...' : 'Pilih file'}</span>
            <span className="text-xs text-muted">PDF, JSON, TXT</span>
            <input
              id={fileId}
              type="file"
              accept=".pdf,.json,.txt,.md,.doc,.docx,application/pdf,application/json,text/plain"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) handleFile(f);
              }}
            />
          </label>
        </Card>
        <Card>
          <SectionTitle>Tempel teks</SectionTitle>
          <TextArea
            aria-label="Teks CV"
            rows={8}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={'Salin seluruh isi CV dari Word, Google Docs, atau WhatsApp lalu tempel di sini.'}
            className="max-h-[50dvh]"
          />
          <Button variant="primary" block className="mt-3" disabled={paste.trim().length < 30} onClick={handlePaste}>
            Baca teks
          </Button>
        </Card>
      </div>
    </div>
  );
}
