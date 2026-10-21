import { useEffect, useMemo, useRef, useState } from 'react';
import type { Cv, TemplateConfig } from '../types';
import { sampleCv } from '../presets/sample';
import { loadPdfJs } from './PdfPreview';
import RENDER_VERSION from 'virtual:render-version';

const cache = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();
const STORE_PREFIX = `thumb:${RENDER_VERSION}:`;

try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('thumb:') && !k.startsWith(STORE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
} catch {
  /* storage unavailable */
}

export function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(STORE_PREFIX + key);
  } catch {
    return null;
  }
}

function store(key: string, url: string) {
  try {
    localStorage.setItem(STORE_PREFIX + key, url);
  } catch {
    // Quota full: drop old thumbnails and keep going without persisting.
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
  }
}

let samplePhoto: Promise<string> | null = null;

// A neutral silhouette so photo layouts look complete in the gallery without shipping a stock photo.
function placeholderPhoto(): Promise<string> {
  samplePhoto ??= Promise.resolve().then(() => {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 400;
    const g = c.getContext('2d')!;
    g.fillStyle = '#c9d3e3';
    g.fillRect(0, 0, 300, 400);
    g.fillStyle = '#8796ad';
    g.beginPath();
    g.arc(150, 160, 70, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(150, 400, 130, 140, 0, Math.PI, 0);
    g.fill();
    return c.toDataURL('image/jpeg', 0.85);
  });
  return samplePhoto;
}

// Thumbnails render one at a time; rendering many in parallel freezes low-end phones.
function renderThumb(key: string, cv: Cv, tpl: TemplateConfig, photo: string | undefined, width: number): Promise<string> {
  const hit = cache.get(key) ?? readStored(key);
  if (hit) {
    cache.set(key, hit);
    return Promise.resolve(hit);
  }
  const job = queue.then(async () => {
    const { renderCvPdf } = await import('../pdf/document');
    const blob = await renderCvPdf(cv, tpl, photo);
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    doc.destroy();
    const url = canvas.toDataURL('image/webp', 0.8);
    cache.set(key, url);
    store(key, url);
    return url;
  });
  queue = job.catch(() => undefined);
  return job;
}

// Only thumbnails near the viewport join the render queue, so the first visible cards appear first.
function Thumb({ make, alt, ratio }: { make: () => Promise<string>; alt: string; ratio: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (!('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible) return;
    let live = true;
    setFailed(false);
    make()
      .then((u) => live && setSrc(u))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [make, visible]);
  return (
    <div ref={ref} className="relative overflow-hidden rounded-md border border-line bg-white" style={{ aspectRatio: ratio }}>
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover object-top" />
      ) : (
        <div className="grid size-full place-items-center p-2 text-center text-xs text-[#57534e]">{failed ? 'Preview gagal dibuat' : 'Menyiapkan preview...'}</div>
      )}
    </div>
  );
}

const RATIO: Record<TemplateConfig['paper'], string> = { A4: '210/297', LETTER: '216/279', F4: '215/330', LEGAL: '216/356' };

export function TemplateThumb({ tpl, alt, lang = 'id' }: { tpl: TemplateConfig; alt: string; lang?: 'id' | 'en' }) {
  const key = hash(JSON.stringify([tpl, lang]));
  const make = useMemo(
    () => async () => {
      const cv = sampleCv(lang, tpl.id);
      cv.options.showPhoto = true;
      return renderThumb(key, cv, tpl, await placeholderPhoto(), 360);
    },
    [key],
  );
  return <Thumb make={make} alt={alt} ratio={RATIO[tpl.paper]} />;
}

export function CvThumb({ cv, tpl, photo, alt }: { cv: Cv; tpl: TemplateConfig; photo?: string; alt: string }) {
  const key = hash(JSON.stringify([cv.id, cv.rev, tpl, photo?.length ?? 0]));
  const make = useMemo(() => () => renderThumb(key, cv, tpl, photo, 300), [key]);
  return <Thumb make={make} alt={alt} ratio={RATIO[tpl.paper]} />;
}
