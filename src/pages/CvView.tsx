import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '../components/layout';
import { Button, Card, EmptyState, Loading, SectionTitle, TextArea, Toggle, useUI } from '../components/ui';
import { IconBriefcase, IconCheck, IconCopy, IconDoc, IconDownload, IconEdit, IconImage, IconInfo, IconPrinter, IconShare, IconWarning } from '../components/icons';
import { PdfPreview } from '../components/PdfPreview';
import { db, normalizeCv, patchCv } from '../db';
import { useAsset, useCvPdf, useSettings, useTemplate } from '../hooks';
import { cvFileName } from '../lib/filename';
import { copyText, downloadFile, shareOrDownload } from '../lib/files';
import { inAppBrowser } from '../lib/env';
import { AtsBadge } from '../editor/SetupForm';
import { checkCv, score, type Issue } from '../check/rules';
import { matchKeywords } from '../check/keywords';
import { BUILTIN_TEMPLATES, templateAts } from '../templates';
import type { Cv } from '../types';

function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(url, '_blank');
    }
    setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };
  document.body.appendChild(frame);
}

const LEVEL = {
  error: { icon: IconWarning, cls: 'text-danger', label: 'Perlu diperbaiki' },
  warn: { icon: IconWarning, cls: 'text-warn', label: 'Sebaiknya diperbaiki' },
  tip: { icon: IconInfo, cls: 'text-muted', label: 'Saran' },
};

function Checker({ cv, issues, pages }: { cv: Cv; issues: Issue[]; pages: number }) {
  const navigate = useNavigate();
  const value = score(issues);
  const errors = issues.filter((i) => i.level === 'error').length;
  return (
    <Card>
      <SectionTitle>
        <span id="cek">Cek CV</span>
      </SectionTitle>
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`grid size-14 shrink-0 place-items-center rounded-full border-4 text-lg font-extrabold ${value >= 85 ? 'border-ok text-ok' : value >= 60 ? 'border-warn text-warn' : 'border-danger text-danger'}`}
        >
          {value}
        </div>
        <p className="text-sm text-muted">
          {issues.length === 0
            ? 'Tidak ada masalah. CV siap dikirim.'
            : errors
              ? `${errors} hal perlu diperbaiki sebelum dikirim.`
              : 'Tidak ada kesalahan fatal. Lihat saran di bawah untuk CV yang lebih kuat.'}
          {pages ? ` ${pages} halaman.` : ''}
        </p>
      </div>
      {issues.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {issues.map((i) => {
            const m = LEVEL[i.level];
            return (
              <li key={i.id} className="flex gap-2.5 py-2.5 text-sm">
                <m.icon size={17} className={`mt-0.5 shrink-0 ${m.cls}`} aria-label={m.label} />
                <div className="min-w-0 flex-1">
                  <p className="leading-snug">{i.message}</p>
                  {i.target && (
                    <button type="button" onClick={() => navigate(`/cv/${cv.id}?p=${i.target}`)} className="mt-1 text-xs font-bold text-brand underline-offset-2 hover:underline">
                      Perbaiki
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function KeywordCard({ cv }: { cv: Cv }) {
  const [text, setText] = useState(cv.jobDescription);
  const id = useId();
  useEffect(() => {
    if (text === cv.jobDescription) return;
    const t = setTimeout(() => patchCv(cv.id, (c) => ({ ...c, jobDescription: text })), 600);
    return () => clearTimeout(t);
  }, [text]);
  const result = useMemo(() => matchKeywords(cv, text), [cv, text]);
  return (
    <Card>
      <SectionTitle>Cocokkan dengan lowongan</SectionTitle>
      <label htmlFor={id} className="text-sm text-muted">
        Tempel teks lowongan (kualifikasi & deskripsi kerja). Kata kunci penting yang belum ada di CV akan ditandai. Teks hanya diproses di perangkat ini.
      </label>
      <TextArea
        id={id}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Contoh: Menguasai Microsoft Excel, pengalaman customer service, mampu bekerja dalam tim…"
        className="mt-2 max-h-60"
      />
      {result && (
        <div className="mt-3 text-sm">
          <p className="font-bold">
            Cocok {result.score}%{' '}
            <span className="font-normal text-muted">
              ({result.matched.length} dari {result.keywords.length} kata kunci)
            </span>
          </p>
          {result.missing.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-muted">Belum ada di CV (tambahkan bila memang Anda kuasai):</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {result.missing.map((k) => (
                  <span key={k} className="rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-xs font-semibold">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.matched.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-muted">Sudah ada:</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {result.matched.map((k) => (
                  <span key={k} className="rounded-full border border-ok/40 bg-ok/10 px-2 py-0.5 text-xs font-semibold">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function CvView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useUI();
  const settings = useSettings();
  const cv = useLiveQuery(async () => {
    const c = id ? await db.cvs.get(id) : undefined;
    return c ? normalizeCv(c) : null;
  }, [id]);
  const tpl = useTemplate(cv?.templateId);
  const photo = useAsset(cv?.photoId);
  const pdf = useCvPdf(cv, tpl, photo, 0);
  const [busy, setBusy] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const webview = inAppBrowser();

  useEffect(() => {
    if (!pdf.blob) return;
    import('../pdf/document').then(({ countPages }) => countPages(pdf.blob!)).then(setPages);
  }, [pdf.blob]);

  const issues = useMemo(() => (cv ? checkCv(cv, tpl, pages || undefined) : []), [cv, tpl, pages]);

  if (cv === null)
    return (
      <EmptyState
        title="CV tidak ditemukan"
        body="CV ini mungkin sudah dihapus."
        action={
          <Link to="/" className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-bg">
            Ke daftar CV
          </Link>
        }
      />
    );
  if (!cv || !settings || !tpl) return <Loading />;

  const name = (ext: string, prefix = '') => cvFileName(cv, settings.fileNamePattern, ext, prefix);
  const message = settings.shareMessage.replace(/\{posisi\}/g, cv.targetRole || 'yang dibuka').replace(/\{nama\}/g, cv.personal.fullName || '');
  const pdfFile = () => new File([pdf.blob!], name('pdf'), { type: 'application/pdf' });
  const photoData = photo ?? undefined;

  const run = async (key: string, fn: () => Promise<void> | void) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast((e as Error).message || 'Gagal membuat file.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const atsPdf = async () => {
    const { renderCvPdf } = await import('../pdf/document');
    const blob = await renderCvPdf(
      { ...cv, options: { ...cv.options, showPhoto: false } },
      BUILTIN_TEMPLATES.find((t) => t.id === 'klasik')!,
    );
    return new File([blob], name('pdf', 'ATS_'), { type: 'application/pdf' });
  };
  const docx = async () => {
    const { renderCvDocx } = await import('../export/docx');
    return new File([await renderCvDocx(cv, tpl, photoData)], name('docx'), { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  };
  const images = async (format: 'png' | 'jpeg', stacked: boolean) => {
    const { pdfToImages } = await import('../export/image');
    const blobs = await pdfToImages(pdf.blob!, format, { stacked });
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const base = name(ext);
    return blobs.map((b, i) => new File([b], blobs.length > 1 ? base.replace(`.${ext}`, `_hal${i + 1}.${ext}`) : base, { type: b.type }));
  };
  const text = async (kind: 'txt' | 'md') => {
    const { cvToText, cvToMarkdown } = await import('../export/text');
    const body = kind === 'txt' ? cvToText(cv, tpl.labels) : cvToMarkdown(cv, tpl.labels);
    return new File([body], name(kind), { type: kind === 'txt' ? 'text/plain' : 'text/markdown' });
  };
  const json = async () => {
    const { toJsonResume } = await import('../export/jsonresume');
    return new File([JSON.stringify(toJsonResume(cv), null, 2)], name('json'), { type: 'application/json' });
  };
  const save = (files: File[]) => files.forEach((f, i) => setTimeout(() => downloadFile(f), i * 400));

  const share = () =>
    run('share', async () => {
      const r = await shareOrDownload(pdfFile(), message);
      if (r === 'downloaded') toast('Perangkat ini tidak mendukung bagikan file, PDF diunduh.');
    });

  const bundle = async () => {
    const { makeZip } = await import('../export/zip');
    const files = [pdfFile(), await docx(), await text('txt')];
    if (templateAts(tpl) !== 'safe') files.push(await atsPdf());
    if (photo) files.push(new File([await (await fetch(photo)).blob()], name('jpg', 'Foto_'), { type: 'image/jpeg' }));
    downloadFile(await makeZip(files, name('zip')));
  };

  const ready = !!pdf.blob && !busy;
  const fmt = (key: string, label: string, hint: string, icon: React.ReactNode, fn: () => Promise<void>) => (
    <button
      type="button"
      disabled={!ready}
      onClick={() => run(key, fn)}
      className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-3 py-2 text-left hover:bg-sunken disabled:opacity-50"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{busy === key ? 'Membuat...' : label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Lihat & unduh"
        back={`/cv/${cv.id}`}
        sub={cv.title || cv.personal.fullName || 'CV tanpa nama'}
        actions={
          <Button onClick={() => navigate(`/cv/${cv.id}`)}>
            <IconEdit size={18} /> Edit
          </Button>
        }
      />
      {webview && (
        <div role="alert" className="mb-4 rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm">
          <p className="font-bold">Anda membuka dari browser {webview}.</p>
          <p className="mt-1">
            Browser di dalam aplikasi sering memblokir unduhan. Buka halaman ini di Chrome atau Safari lewat menu ⋮ → "Buka di browser". Sebagai alternatif, unduh sebagai gambar lalu tekan lama untuk
            menyimpan.
          </p>
          <Button size="sm" className="mt-2" onClick={async () => toast((await copyText(window.location.href)) ? 'Tautan disalin.' : 'Gagal menyalin tautan.')}>
            <IconCopy size={16} /> Salin tautan
          </Button>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="order-2 lg:order-1">
          <PdfPreview blob={pdf.blob} busy={pdf.busy} error={pdf.error} />
        </div>
        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <Card>
            <SectionTitle>Unduh CV</SectionTitle>
            <p className="mb-3 truncate font-mono text-xs text-muted" title={name('pdf')}>
              {name('pdf')}
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="lg" block disabled={!ready} onClick={() => run('pdf', () => downloadFile(pdfFile()))}>
                <IconDownload size={18} /> Unduh PDF
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={!ready} onClick={share}>
                  <IconShare size={18} /> Bagikan
                </Button>
                <Button disabled={!ready} onClick={() => run('print', () => printBlob(pdf.blob!))}>
                  <IconPrinter size={18} /> Cetak
                </Button>
              </div>
            </div>
            <Button block variant="ghost" className="mt-2" onClick={() => navigate('/lamaran', { state: { draft: { company: cv.targetCompany, position: cv.targetRole, cvId: cv.id } } })}>
              <IconBriefcase size={18} /> Catat ke pelacak lamaran
            </Button>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              Template {tpl.name} <AtsBadge tpl={tpl} />
              {pages ? <span>· {pages} halaman</span> : null}
            </div>
            <div className="mt-2 border-t border-line pt-2">
              <Toggle
                checked={cv.options.fitOnePage}
                onChange={(v) => patchCv(cv.id, (c) => ({ ...c, options: { ...c.options, fitOnePage: v } }))}
                label="Muat dalam 1 halaman"
                hint="Huruf dan jarak dikecilkan sedikit bila isi melewati 1 halaman."
              />
            </div>
          </Card>

          <Card>
            <SectionTitle>Format lain</SectionTitle>
            <div className="grid gap-2">
              {templateAts(tpl) !== 'safe' && fmt('ats', 'PDF versi ATS', 'Satu kolom tanpa foto, untuk portal lowongan', <IconCheck size={18} />, async () => downloadFile(await atsPdf()))}
              {fmt('docx', 'Word (.docx)', 'Bisa diedit di Word, Google Docs, WPS', <IconDoc size={18} />, async () => downloadFile(await docx()))}
              {fmt('png', 'Gambar PNG', 'Per halaman, tajam untuk dikirim lewat chat', <IconImage size={18} />, async () => save(await images('png', false)))}
              {fmt('jpg', 'Gambar JPG (1 file panjang)', 'Semua halaman disambung, ukuran kecil', <IconImage size={18} />, async () => save(await images('jpeg', true)))}
              {fmt('txt', 'Teks biasa (.txt)', 'Untuk ditempel ke formulir lowongan', <IconDoc size={18} />, async () => downloadFile(await text('txt')))}
              {fmt('copy', 'Salin teks CV', 'Langsung ke clipboard', <IconCopy size={18} />, async () => {
                const ok = await copyText(await (await text('txt')).text());
                toast(ok ? 'Teks CV disalin.' : 'Gagal menyalin. Unduh sebagai .txt.', ok ? 'ok' : 'error');
              })}
              {fmt('md', 'Markdown (.md)', 'Untuk GitHub, Notion, atau blog', <IconDoc size={18} />, async () => downloadFile(await text('md')))}
              {fmt('json', 'JSON Resume', 'Format terbuka, bisa diimpor kembali', <IconDoc size={18} />, async () => downloadFile(await json()))}
              {fmt('zip', 'Paket lengkap (.zip)', 'PDF, Word, teks, dan foto dalam satu file', <IconDownload size={18} />, bundle)}
            </div>
          </Card>

          <Checker cv={cv} issues={issues} pages={pages} />
          <KeywordCard cv={cv} />
        </div>
      </div>
    </div>
  );
}
