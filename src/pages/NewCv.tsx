import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout';
import { Button, Card, Field, Segmented, Select, SectionTitle, TextInput, useUI } from '../components/ui';
import { createCv, db, duplicateCv, emptySection } from '../db';
import { useSettings } from '../hooks';
import { COUNTRIES, countryPreset, optionsForCountry } from '../presets/countries';
import { PURPOSES, type PurposeKey } from '../presets/purposes';
import { sampleCv } from '../presets/sample';
import { uid } from '../lib/id';
import type { CountryKey, Lang } from '../types';

type Source = 'blank' | 'copy' | 'sample';

function Choice({ active, onClick, title, hint }: { active: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex min-h-16 flex-col items-start justify-center rounded-xl border px-4 py-3 text-left transition-colors ${active ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-sunken'}`}
    >
      <span className="text-sm font-bold">{title}</span>
      <span className="text-xs text-muted">{hint}</span>
    </button>
  );
}

export function NewCv() {
  const navigate = useNavigate();
  const { toast } = useUI();
  const settings = useSettings();
  const cvs = useLiveQuery(() => db.cvs.orderBy('updatedAt').reverse().toArray(), []);
  const [purpose, setPurpose] = useState<PurposeKey>('fresh');
  const [country, setCountry] = useState<CountryKey>('ID');
  const [lang, setLang] = useState<Lang>('id');
  const [source, setSource] = useState<Source>('blank');
  const [copyFrom, setCopyFrom] = useState('');
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) {
      setCountry(settings.defaults.country);
      setLang(settings.defaults.lang);
    }
  }, [settings?.id]);

  useEffect(() => {
    if (cvs?.length && !copyFrom) setCopyFrom(cvs[0].id);
  }, [cvs, copyFrom]);

  const pickPurpose = (p: PurposeKey) => {
    setPurpose(p);
    if (p === 'abroad' && country === 'ID') pickCountry('JP');
    if (p !== 'abroad' && country !== 'ID') pickCountry('ID');
  };

  const pickCountry = (c: CountryKey) => {
    setCountry(c);
    setLang(countryPreset(c).lang);
  };

  const preset = countryPreset(country);

  const create = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const templateId = preset.templateId;
      const base = { country, lang, targetRole: role.trim(), templateId };
      let id: string | undefined;
      if (source === 'copy' && copyFrom) {
        const src = await db.cvs.get(copyFrom);
        const copy = src && (await duplicateCv(copyFrom, { targetRole: role.trim() || src.targetRole, title: '', country, lang, options: { ...src.options, ...optionsForCountry(country) } }));
        id = copy?.id;
      } else if (source === 'sample') {
        const sample = sampleCv(lang, templateId);
        const cv = await createCv({ ...base, personal: sample.personal, sections: sample.sections.map((x) => ({ ...x, id: uid(), entries: x.entries.map((e) => ({ ...e, id: uid() })) })) });
        id = cv.id;
      } else {
        const sections = PURPOSES.find((p) => p.key === purpose)!.sections.map(emptySection);
        const cv = await createCv({ ...base, sections });
        id = cv.id;
      }
      if (!id) throw new Error('CV sumber tidak ditemukan.');
      navigate(`/cv/${id}`, { replace: true, state: { fresh: true } });
    } catch (e) {
      toast((e as Error).message || 'CV gagal dibuat.', 'error');
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Buat CV baru" back="/" sub="Bisa diubah lagi kapan saja" />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Untuk keperluan apa?</SectionTitle>
          <div role="radiogroup" aria-label="Keperluan" className="grid gap-2 sm:grid-cols-2">
            {PURPOSES.map((p) => (
              <Choice key={p.key} active={purpose === p.key} onClick={() => pickPurpose(p.key)} title={p.name} hint={p.hint} />
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Negara tujuan</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Negara" htmlFor="country">
              <Select id="country" value={country} onChange={(e) => pickCountry(e.target.value as CountryKey)}>
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
          <p className="mt-3 rounded-xl bg-sunken px-3 py-2.5 text-xs leading-relaxed text-muted">{preset.tip}</p>
          {lang === 'id' && country !== 'ID' ? <p className="mt-2 text-xs font-semibold text-warn">Perusahaan di luar negeri umumnya meminta CV berbahasa Inggris.</p> : null}
        </Card>

        <Card>
          <SectionTitle>Posisi yang dilamar</SectionTitle>
          <Field label="Posisi (opsional)" htmlFor="role" hint="Dipakai untuk nama file dan pengecekan kata kunci.">
            <TextInput id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Contoh: Admin Gudang, Staff Marketing" />
          </Field>
        </Card>

        <Card>
          <SectionTitle>Mulai dari</SectionTitle>
          <div role="radiogroup" aria-label="Mulai dari" className="grid gap-2 sm:grid-cols-3">
            <Choice active={source === 'blank'} onClick={() => setSource('blank')} title="Kosong" hint="Isi dari awal" />
            <Choice active={source === 'copy'} onClick={() => setSource('copy')} title="Salin CV lain" hint={cvs?.length ? 'Pakai data yang sudah ada' : 'Belum ada CV'} />
            <Choice active={source === 'sample'} onClick={() => setSource('sample')} title="Contoh isian" hint="Lihat contoh lalu ganti" />
          </div>
          <p className="mt-3 text-sm text-muted">
            Punya CV lama atau profil LinkedIn?{' '}
            <Link to="/impor" className="font-bold text-text underline underline-offset-2">
              Impor dari PDF
            </Link>
          </p>
          {source === 'copy' &&
            (cvs?.length ? (
              <Field label="Salin dari" htmlFor="copy" className="mt-3">
                <Select id="copy" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.personal.fullName || 'Tanpa nama'} {c.targetRole ? `· ${c.targetRole}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <p className="mt-3 text-sm text-muted">Anda belum punya CV untuk disalin. Pilih "Kosong" atau "Contoh isian".</p>
            ))}
        </Card>
      </div>
      <div className="sticky bottom-0 z-20 -mx-4 mt-4 border-t border-line bg-bg/95 px-4 py-3 pb-safe backdrop-blur md:static md:mx-0 md:flex md:justify-end md:border-0 md:bg-transparent md:px-0">
        <Button variant="primary" size="lg" block className="md:w-auto md:min-w-60" onClick={create} disabled={busy || (source === 'copy' && !cvs?.length)}>
          {busy ? 'Membuat...' : 'Buat CV'}
        </Button>
      </div>
    </div>
  );
}
