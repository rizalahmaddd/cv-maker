import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, EmptyState, Field, IconButton, Loading, Segmented, Select, SectionTitle, Sheet, TextArea, TextInput, useUI } from '../components/ui';
import { IconBack, IconClose, IconCopy, IconDoc, IconDownload, IconEye, IconPlus, IconShare, IconUp } from '../components/icons';
import { PdfPreview } from '../components/PdfPreview';
import { blankCv, db, getAssetData, normalizeCv, putAsset, releaseAsset } from '../db';
import { useMedia, useTemplate } from '../hooks';
import { defaultSubject, letterToText, letterTokens, normalizeLetter, presetBody } from '../lib/letter';
import { copyText, downloadFile, imageToDataURL, removeWhiteBackground, safeFileName, shareOrDownload } from '../lib/files';
import { normalizeText } from '../lib/text';
import { fullName } from '../lib/view';
import { ATTACHMENT_OPTIONS, CLOSING, LETTER_PRESETS, SALUTATION, SOURCES } from '../presets/letters';
import type { Cv, Lang, Letter } from '../types';

export function LetterEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, confirm } = useUI();
  const stored = useLiveQuery(async () => (id ? ((await db.letters.get(id)) ?? null) : null), [id]);
  const cvs = useLiveQuery(() => db.cvs.orderBy('updatedAt').reverse().toArray(), []);
  const [l, setL] = useState<Letter | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const wide = useMedia('(min-width: 1024px)');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const run = useRef(0);
  const base = useId();

  useEffect(() => {
    if (stored && (!l || l.id !== stored.id)) setL(normalizeLetter(stored));
  }, [stored]);

  const cvRow = cvs?.find((c) => c.id === l?.cvId);
  const cv: Cv | undefined = useMemo(() => (cvRow ? normalizeCv(cvRow) : undefined), [cvRow]);
  const tpl = useTemplate(cv?.templateId ?? 'klasik');
  const signature = useLiveQuery(async () => (l?.signatureId ? ((await getAssetData(l.signatureId)) ?? null) : null), [l?.signatureId]);

  useEffect(() => {
    if (!l || !tpl || signature === undefined) return;
    const n = ++run.current;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const { renderLetterPdf } = await import('../pdf/letter');
        const b = await renderLetterPdf(l, cv ?? blankCv('ID', l.lang, 'klasik'), tpl, signature ?? undefined);
        if (n === run.current) {
          setBlob(b);
          setError(null);
        }
      } catch (e) {
        if (n === run.current) setError((e as Error).message);
      } finally {
        if (n === run.current) setBusy(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [l, cv, tpl, signature]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  if (stored === null)
    return (
      <EmptyState
        title="Surat tidak ditemukan"
        body="Surat ini mungkin sudah dihapus."
        action={
          <Link to="/surat" className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-bg">
            Ke daftar surat
          </Link>
        }
      />
    );
  if (!l || !cvs) return <Loading />;

  const update = (patch: Partial<Letter>) => {
    setL((cur) => {
      const next = { ...cur!, ...patch, updatedAt: Date.now() };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => db.letters.put(next), 350);
      return next;
    });
  };
  const text = (key: keyof Letter, label: string, opts: { placeholder?: string; list?: string; hint?: string } = {}) => (
    <Field label={label} htmlFor={`${base}-${key}`} hint={opts.hint}>
      <TextInput id={`${base}-${key}`} list={opts.list} value={l[key] as string} placeholder={opts.placeholder} onChange={(e) => update({ [key]: normalizeText(e.target.value) })} />
    </Field>
  );

  const applyPreset = async (key: string) => {
    if (l.body.trim()) {
      const ok = await confirm({ title: 'Ganti isi surat?', message: 'Isi surat sekarang akan diganti dengan template paragraf yang dipilih.', confirmLabel: 'Ganti' });
      if (!ok) return;
    }
    update({ body: presetBody(key, l.lang) });
  };

  const switchLang = (lang: Lang) => {
    const patch: Partial<Letter> = { lang };
    if (l.salutation === SALUTATION[l.lang]) patch.salutation = SALUTATION[lang];
    if (l.closing === CLOSING[l.lang]) patch.closing = CLOSING[lang];
    if (l.subject === defaultSubject(l.lang, l.position)) patch.subject = defaultSubject(lang, l.position);
    update(patch);
  };

  const pickSignature = async (f: File) => {
    try {
      const data = await removeWhiteBackground(await imageToDataURL(f, 600));
      const sid = await putAsset('signature', data);
      const old = l.signatureId;
      update({ signatureId: sid });
      if (old && old !== sid) setTimeout(() => releaseAsset(old), 1000);
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const moveAttachment = (i: number, d: -1 | 1) => {
    const a = [...l.attachments];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    update({ attachments: a });
  };

  const name = cv ? fullName(cv) : '';
  const tokens = letterTokens(cv, l);
  const missing = [...new Set([...l.body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].filter((k) => tokens[k]?.startsWith('[')).map((k) => tokens[k].slice(1, -1));
  const fileBase = safeFileName(`Surat_Lamaran_${cv?.personal.fullName || 'Saya'}${l.company ? `_${l.company}` : ''}`).replace(/_{2,}/g, '_');

  const exportPdf = async (share = false) => {
    if (!blob) return;
    const f = new File([blob], `${fileBase}.pdf`, { type: 'application/pdf' });
    if (share) await shareOrDownload(f, l.subject);
    else downloadFile(f);
  };
  const exportDocx = async () => {
    const { renderLetterDocx } = await import('../export/letterDocx');
    const b = await renderLetterDocx(l, cv ?? blankCv('ID', l.lang, 'klasik'), tpl!, signature ?? undefined);
    downloadFile(new File([b], `${fileBase}.docx`, { type: b.type }));
  };
  const copyBody = async () => toast((await copyText(letterToText(l, cv, name))) ? 'Isi surat disalin, siap ditempel ke email.' : 'Gagal menyalin.', 'ok');

  const preview = <PdfPreview blob={blob} busy={busy} error={error} />;
  const sigId = `${base}-sig`;

  const actions = (
    <div className="flex flex-col gap-2">
      <Button variant="primary" block disabled={!blob} onClick={() => exportPdf()}>
        <IconDownload size={18} /> Unduh PDF
      </Button>
      <div className="grid grid-cols-3 gap-2">
        <Button disabled={!blob} onClick={() => exportPdf(true)}>
          <IconShare size={17} /> Bagikan
        </Button>
        <Button onClick={exportDocx}>
          <IconDoc size={17} /> Word
        </Button>
        <Button onClick={copyBody}>
          <IconCopy size={17} /> Teks
        </Button>
      </div>
    </div>
  );

  return (
    <div className="-mt-4 md:-mt-8">
      <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-1 border-b border-line bg-bg/95 px-2 py-2 backdrop-blur md:-mx-8 md:px-6">
        <IconButton label="Kembali ke daftar surat" onClick={() => navigate('/surat')}>
          <IconBack />
        </IconButton>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight">{l.title || l.subject || 'Surat lamaran'}</p>
          <p className="truncate text-xs text-muted">Tersimpan otomatis</p>
        </div>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle>Data surat</SectionTitle>
            <div className="flex flex-col gap-3">
              <Field label="Data pelamar dari CV" htmlFor={`${base}-cv`} hint={cv ? undefined : <span className="font-semibold text-warn">Pilih CV supaya nama dan kontak tampil di surat.</span>}>
                <Select id={`${base}-cv`} value={l.cvId ?? ''} onChange={(e) => update({ cvId: e.target.value || undefined })}>
                  <option value="">Tanpa CV</option>
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.personal.fullName || 'CV tanpa nama'}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Bahasa">
                <Segmented<Lang>
                  label="Bahasa surat"
                  value={l.lang}
                  onChange={switchLang}
                  options={[
                    { value: 'id', label: 'Indonesia' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                {text('position', 'Posisi dilamar', { placeholder: 'Staff Administrasi' })}
                {text('company', 'Nama perusahaan', { placeholder: 'PT Contoh Jaya' })}
                {text('source', 'Sumber info lowongan', { list: 'letter-sources', placeholder: 'JobStreet' })}
                {text('recipient', 'Ditujukan kepada', { placeholder: 'Bapak/Ibu Pimpinan HRD' })}
                {text('recipientTitle', 'Jabatan / bagian (opsional)', { placeholder: 'HRD Manager' })}
                {text('companyAddress', 'Alamat perusahaan (opsional)', { placeholder: 'Jl. Sudirman No. 1, Jakarta' })}
                {text('place', 'Kota penulisan', { placeholder: 'Malang' })}
                <Field label="Tanggal" htmlFor={`${base}-date`}>
                  <TextInput id={`${base}-date`} type="date" value={l.date} onChange={(e) => update({ date: e.target.value })} />
                </Field>
              </div>
              <datalist id="letter-sources">
                {SOURCES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <Field label="Perihal / subjek" htmlFor={`${base}-subject`}>
                <div className="flex gap-2">
                  <TextInput id={`${base}-subject`} value={l.subject} onChange={(e) => update({ subject: normalizeText(e.target.value) })} />
                  <Button onClick={() => update({ subject: defaultSubject(l.lang, l.position) })} title="Isi otomatis dari posisi">
                    Otomatis
                  </Button>
                </div>
              </Field>
            </div>
          </Card>

          <Card>
            <SectionTitle
              action={
                <div className="w-44 shrink-0">
                  <Select aria-label="Template paragraf" value="" onChange={(e) => e.target.value && applyPreset(e.target.value)} className="min-h-9 py-0 text-sm">
                    <option value="">Pakai template…</option>
                    {LETTER_PRESETS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
              }
            >
              Isi surat
            </SectionTitle>
            <div className="flex flex-col gap-3">
              {text('salutation', 'Salam pembuka')}
              <Field
                label="Paragraf"
                htmlFor={`${base}-body`}
                hint="Pisahkan paragraf dengan baris kosong. Kode {posisi}, {perusahaan}, {sumber}, {pendidikan}, {keahlian}, {jabatan} terisi otomatis. [lampiran] di baris sendiri menjadi daftar berkas."
              >
                <TextArea id={`${base}-body`} rows={10} value={l.body} onChange={(e) => update({ body: normalizeText(e.target.value) })} />
              </Field>
              {missing.length > 0 && <p className="text-xs font-semibold text-warn">Lengkapi dulu: {missing.join(', ')}.</p>}
              {text('closing', 'Salam penutup')}
            </div>
          </Card>

          <Card>
            <SectionTitle>Berkas lampiran</SectionTitle>
            <ul className="flex flex-col gap-1.5">
              {l.attachments.map((a, i) => (
                <li key={i} className="flex items-center gap-1 rounded-xl border border-line px-2 py-1">
                  <span className="w-6 text-center text-sm text-muted">{i + 1}.</span>
                  <TextInput
                    aria-label={`Lampiran ${i + 1}`}
                    value={a}
                    onChange={(e) => update({ attachments: l.attachments.map((x, j) => (j === i ? e.target.value : x)) })}
                    className="min-h-10 border-0 px-1"
                  />
                  <IconButton label="Naikkan" onClick={() => moveAttachment(i, -1)} disabled={i === 0} className="size-9">
                    <IconUp size={16} />
                  </IconButton>
                  <IconButton label="Hapus lampiran" onClick={() => update({ attachments: l.attachments.filter((_, j) => j !== i) })} className="size-9">
                    <IconClose size={16} />
                  </IconButton>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ATTACHMENT_OPTIONS.filter((o) => !l.attachments.includes(o)).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => update({ attachments: [...l.attachments, o] })}
                  className="min-h-9 rounded-full border border-dashed border-line px-3 text-xs font-semibold text-muted hover:bg-sunken hover:text-text"
                >
                  + {o}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <TextInput aria-label="Lampiran lain" placeholder="Lampiran lain" value={custom} onChange={(e) => setCustom(e.target.value)} />
              <Button
                aria-label="Tambah lampiran"
                disabled={!custom.trim()}
                onClick={() => {
                  update({ attachments: [...l.attachments, custom.trim()] });
                  setCustom('');
                }}
              >
                <IconPlus size={18} />
              </Button>
            </div>
          </Card>

          <Card>
            <SectionTitle>Tanda tangan</SectionTitle>
            <div className="flex items-center gap-3">
              <div className="grid h-20 w-36 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-[conic-gradient(#e5e5e5_25%,#fff_0_50%,#e5e5e5_0_75%,#fff_0)] bg-[length:12px_12px]">
                {signature ? <img src={signature} alt="Tanda tangan" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-[#57534e]">Belum ada</span>}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted">Foto tanda tangan di kertas putih. Latar putih dihapus otomatis.</p>
                <div className="flex gap-2">
                  <label
                    htmlFor={sigId}
                    className="inline-flex min-h-9 cursor-pointer items-center rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:bg-sunken focus-within:outline-2 focus-within:outline-[var(--focus)]"
                  >
                    {signature ? 'Ganti' : 'Pilih gambar'}
                    <input
                      id={sigId}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (f) pickSignature(f);
                      }}
                    />
                  </label>
                  {signature && (
                    <Button size="sm" variant="ghost" onClick={() => update({ signatureId: undefined })}>
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
          {wide ? null : <Card>{actions}</Card>}
        </div>
        {wide ? (
          <div className="sticky top-20 flex flex-col gap-3">
            {actions}
            {preview}
          </div>
        ) : (
          <>
            <div className="fixed inset-x-0 bottom-0 z-30 md:left-[var(--sidebar-w)] flex gap-2 border-t border-line bg-surface/95 px-3 pt-2.5 pb-safe backdrop-blur-md">
              <Button onClick={() => setPreviewOpen(true)} className="flex-1">
                <IconEye size={18} /> Pratinjau
              </Button>
              <Button variant="primary" className="flex-1" disabled={!blob} onClick={() => exportPdf()}>
                <IconDownload size={18} /> PDF
              </Button>
            </div>
            <Sheet open={previewOpen} onClose={() => setPreviewOpen(false)} title="Pratinjau surat" size="full">
              {preview}
            </Sheet>
          </>
        )}
      </div>
    </div>
  );
}
