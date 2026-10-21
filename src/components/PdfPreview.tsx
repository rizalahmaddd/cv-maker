import { useEffect, useRef, useState } from 'react';
import { IconZoomIn, IconZoomOut } from './icons';

type PdfJs = typeof import('pdfjs-dist');
let pdfjsPromise: Promise<PdfJs> | null = null;

export function loadPdfJs() {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return pdfjsPromise;
}

export function PdfPreview({ blob, busy, error, showControls = true }: { blob: Blob | null; busy?: boolean; error?: string | null; showControls?: boolean }) {
  const holder = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!blob || !holder.current) return;
    let cancelled = false;
    const el = holder.current;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        if (cancelled) return;
        const width = el.clientWidth || 360;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr * zoom });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(width * zoom)}px`;
          canvas.style.maxWidth = zoom > 1 ? 'none' : '100%';
          canvas.style.height = 'auto';
          canvas.className = 'pdf-page mx-auto block shadow-md';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `Halaman ${i} dari ${doc.numPages}`);
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          if (cancelled) return;
          canvases.push(canvas);
        }
        el.replaceChildren(...canvases);
        setPages(doc.numPages);
        setRenderError(null);
        doc.destroy();
      } catch (e) {
        if (!cancelled) setRenderError((e as Error).message || 'Preview gagal dibuat.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob, zoom]);

  const shownError = error || renderError;

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.7));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="relative flex flex-col rounded-2xl border border-line bg-surface overflow-hidden shadow-xs">
      {showControls && (
        <div className="flex items-center justify-between border-b border-line bg-sunken/40 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text">Pratinjau PDF</span>
            {busy && (
              <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand animate-pulse">
                <span className="size-1.5 rounded-full bg-brand" />
                Memperbarui...
              </span>
            )}
            {pages > 0 && <span className="text-muted">({pages} halaman)</span>}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.75}
              title="Perkecil"
              aria-label="Perkecil pratinjau"
              className="inline-grid size-7 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-sunken hover:text-text disabled:opacity-40"
            >
              <IconZoomOut size={14} />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom"
              className="min-w-10 rounded-lg border border-line bg-surface px-1.5 py-1 text-center font-mono text-[11px] font-bold text-muted transition-colors hover:bg-sunken hover:text-text"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.75}
              title="Perbesar"
              aria-label="Perbesar pratinjau"
              className="inline-grid size-7 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-sunken hover:text-text disabled:opacity-40"
            >
              <IconZoomIn size={14} />
            </button>
          </div>
        </div>
      )}
      <div ref={containerRef} className="custom-scrollbar max-h-[calc(100dvh-12rem)] overflow-auto bg-sunken/20 p-4 sm:p-6">
        <div ref={holder} className="flex flex-col items-center gap-4" aria-busy={busy} />

        {!blob && !shownError && <div className="paper-skeleton mx-auto flex max-w-md items-center justify-center text-sm font-medium text-muted">Menyiapkan pratinjau PDF...</div>}

        {shownError && (
          <div role="alert" className="mx-auto max-w-md rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            Pratinjau gagal dibuat: {shownError}
          </div>
        )}
      </div>
    </div>
  );
}
