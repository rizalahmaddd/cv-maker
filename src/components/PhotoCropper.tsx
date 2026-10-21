import { useEffect, useRef, useState } from 'react';
import { Button, Segmented, Sheet } from './ui';

type Source = ImageBitmap | HTMLImageElement;

async function decode(file: File): Promise<Source> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error('File harus berupa gambar (JPG atau PNG).');
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Gambar tidak bisa dibuka. Jika foto dari iPhone (HEIC), ubah dulu ke JPG atau ambil tangkapan layar fotonya.'));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export type PhotoAspect = '3x4' | 'square';

const OUT = { '3x4': [450, 600], square: [500, 500] } as const;

export function PhotoCropper({ file, onDone, onClose, initialAspect = '3x4' }: { file: File | null; onDone: (dataUrl: string) => void; onClose: () => void; initialAspect?: PhotoAspect }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspect, setAspect] = useState<PhotoAspect>(initialAspect);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const W = 280;
  const H = aspect === '3x4' ? (W * 4) / 3 : W;

  useEffect(() => {
    if (!file) return;
    let live = true;
    setImg(null);
    setError(null);
    setZoom(1);
    setRot(0);
    setOff({ x: 0, y: 0 });
    decode(file)
      .then((i) => live && setImg(i))
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, [file]);

  const dims = () => {
    if (!img) return { iw: 1, ih: 1, cover: 1 };
    const iw = img.width;
    const ih = img.height;
    const [rw, rh] = rot % 180 ? [ih, iw] : [iw, ih];
    return { iw, ih, cover: Math.max(W / rw, H / rh), rw, rh };
  };

  const clamp = (o: { x: number; y: number }, z = zoom) => {
    const d = dims();
    const s = d.cover * z;
    const mx = Math.max(0, ((d.rw ?? d.iw) * s - W) / 2);
    const my = Math.max(0, ((d.rh ?? d.ih) * s - H) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  };

  const draw = (ctx: CanvasRenderingContext2D, k: number) => {
    if (!img) return;
    const d = dims();
    const s = d.cover * zoom * k;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W * k, H * k);
    ctx.save();
    ctx.translate((W / 2 + off.x) * k, (H / 2 + off.y) * k);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (-d.iw * s) / 2, (-d.ih * s) / 2, d.iw * s, d.ih * s);
    ctx.restore();
  };

  useEffect(() => {
    const c = canvas.current;
    if (!c || !img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr;
    c.height = H * dpr;
    draw(c.getContext('2d')!, dpr);
  });

  useEffect(() => {
    setOff((o) => clamp(o));
  }, [aspect, rot, zoom, img]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const z = Math.min(4, Math.max(1, (pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.dist));
      setZoom(z);
      return;
    }
    setOff((o) => clamp({ x: o.x + e.clientX - prev.x, y: o.y + e.clientY - prev.y }));
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const save = () => {
    const [ow] = OUT[aspect];
    const k = ow / W;
    const c = document.createElement('canvas');
    c.width = Math.round(W * k);
    c.height = Math.round(H * k);
    draw(c.getContext('2d')!, k);
    onDone(c.toDataURL('image/jpeg', 0.88));
  };

  return (
    <Sheet
      open={!!file}
      onClose={onClose}
      title="Atur foto"
      footer={
        <div className="flex gap-2">
          <Button onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button variant="primary" onClick={save} disabled={!img} className="flex-1">
            Pakai foto
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <Segmented<PhotoAspect>
          label="Bentuk foto"
          value={aspect}
          onChange={setAspect}
          options={[
            { value: '3x4', label: 'Pas foto 3×4' },
            { value: 'square', label: 'Persegi' },
          ]}
        />
        {error ? (
          <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </p>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-line bg-sunken" style={{ width: W, height: H }}>
            {!img && <p className="grid size-full place-items-center text-sm text-muted">Membuka foto...</p>}
            <canvas
              ref={canvas}
              style={{ width: W, height: H, touchAction: 'none' }}
              className={`cursor-grab active:cursor-grabbing ${img ? '' : 'hidden'}`}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onWheel={(e) => setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002)))}
              aria-label="Geser untuk mengatur posisi foto"
            />
            {aspect === 'square' && <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" />}
          </div>
        )}
        <div className="flex w-full max-w-xs items-center gap-3">
          <label htmlFor="photo-zoom" className="text-sm font-semibold">
            Zoom
          </label>
          <input id="photo-zoom" type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--brand)]" />
          <Button size="sm" onClick={() => setRot((r) => (r + 90) % 360)}>
            Putar
          </Button>
        </div>
        <p className="text-center text-xs text-muted">Geser foto untuk mengatur posisi. Gunakan foto formal dengan wajah terlihat jelas dan latar polos.</p>
      </div>
    </Sheet>
  );
}
