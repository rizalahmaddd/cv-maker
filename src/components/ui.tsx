import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { IconChevronDown, IconClose } from './icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-bg hover:opacity-90',
  brand: 'bg-brand text-white dark:text-[#0a0a0a] hover:opacity-90',
  secondary: 'bg-surface text-text border border-line hover:bg-sunken',
  ghost: 'text-text hover:bg-sunken',
  danger: 'bg-surface text-danger border border-danger/40 hover:bg-danger/10',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'md' | 'lg' | 'sm'; block?: boolean }>(function Button(
  { variant = 'secondary', size = 'md', block, className = '', type = 'button', ...rest },
  ref,
) {
  const sizes = { sm: 'min-h-9 px-3 text-sm', md: 'min-h-11 px-4 text-sm', lg: 'min-h-12 px-5 text-base' };
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
});

export function IconButton({ label, className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-grid size-11 shrink-0 place-items-center rounded-xl text-text hover:bg-sunken disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children, htmlFor, className = '' }: { label: ReactNode; hint?: ReactNode; children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-text">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const inputBase =
  'w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-text placeholder:text-muted/70 focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className = '', ...rest }, ref) {
  return <input ref={ref} className={`${inputBase} min-h-11 ${className}`} {...rest} />;
});

export function TextArea({ className = '', autoGrow = true, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { autoGrow?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !autoGrow) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [rest.value, autoGrow]);
  return <textarea ref={ref} rows={2} className={`${inputBase} min-h-11 resize-y py-2.5 leading-relaxed ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative inline-flex w-full items-center">
      <select className={`${inputBase} min-h-11 w-full appearance-none pr-10 cursor-pointer ${className}`} {...rest}>
        {children}
      </select>
      <IconChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          checked ? 'bg-brand' : 'bg-line'
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-6 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl border border-line bg-sunken p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 flex-1 rounded-lg px-2 text-sm font-semibold transition-colors ${value === o.value ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-4 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-9 items-center justify-between gap-2">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {action}
    </div>
  );
}

let sheetSeq = 0;

// An open sheet owns one history entry, so the phone's back button or swipe closes it instead of leaving the page.
function useBackToClose(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = ++sheetSeq;
    window.history.pushState({ ...window.history.state, sheet: id }, '');
    const onPop = () => {
      if ((window.history.state?.sheet ?? 0) < id) close.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Deferred so a sheet that remounts right away (StrictMode, route state) keeps its entry instead of closing itself.
      setTimeout(() => window.history.state?.sheet === id && window.history.back(), 0);
    };
  }, [open]);
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'full';
  actions?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useBackToClose(open, onClose);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const sizing =
    size === 'full'
      ? 'h-dvh max-h-dvh rounded-none sm:m-auto sm:h-[92dvh] sm:max-h-[92dvh] sm:max-w-4xl sm:rounded-2xl sm:border'
      : `mt-auto max-h-[92dvh] rounded-t-3xl border-t sm:m-auto sm:max-h-[85dvh] sm:rounded-2xl sm:border ${size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`;
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-0 w-full max-w-none overflow-hidden border-line bg-surface p-0 text-text backdrop:bg-black/50 backdrop:backdrop-blur-xs sm:shadow-2xl ${sizing}`}
    >
      {open && (
        <div className={`flex flex-col ${size === 'full' ? 'h-dvh sm:h-[92dvh]' : 'max-h-[92dvh] sm:max-h-[85dvh]'}`}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
            <h2 className="min-w-0 truncate text-base font-bold tracking-tight">{title}</h2>
            <div className="-mr-1 flex items-center gap-1">
              {actions}
              <IconButton label="Tutup" onClick={onClose}>
                <IconClose size={18} />
              </IconButton>
            </div>
          </div>
          <div className={`custom-scrollbar flex-1 overflow-y-auto ${size === 'full' ? 'p-0' : 'px-5 py-5 sm:px-6 sm:py-6'}`}>{children}</div>
          {footer && <div className="border-t border-line bg-surface px-5 pt-4 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] sm:rounded-b-2xl sm:px-6 sm:py-5">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

interface ConfirmOpts {
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

type ToastFn = (msg: string, kind?: 'ok' | 'error', action?: ToastAction) => void;

const ToastCtx = createContext<{ toast: ToastFn; confirm: (o: ConfirmOpts) => Promise<boolean> }>({
  toast: () => {},
  confirm: async () => false,
});

export function useUI() {
  return useContext(ToastCtx);
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: 'ok' | 'error'; action?: ToastAction }[]>([]);
  const [pending, setPending] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);

  const toast = useCallback<ToastFn>((msg, kind = 'ok', action) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' || action ? 6000 : 3000);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), []);

  const close = (v: boolean) => {
    pending?.resolve(v);
    setPending(null);
  };

  return (
    <ToastCtx.Provider value={{ toast, confirm }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${t.kind === 'error' ? 'bg-danger text-white dark:text-[#0a0a0a]' : 'bg-ink text-bg'}`}
          >
            <span>{t.msg}</span>
            {t.action && (
              <button
                type="button"
                className="-my-1 shrink-0 rounded-lg px-2 py-1 font-bold underline underline-offset-2 hover:bg-white/10"
                onClick={() => {
                  t.action!.onClick();
                  setToasts((all) => all.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
      <Sheet
        open={!!pending}
        onClose={() => close(false)}
        title={pending?.title ?? ''}
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 w-full">
            <Button onClick={() => close(false)} className="sm:min-w-24">
              Batal
            </Button>
            <Button variant={pending?.danger ? 'danger' : 'primary'} onClick={() => close(true)} className="sm:min-w-24">
              {pending?.confirmLabel}
            </Button>
          </div>
        }
      >
        <div className="text-sm leading-relaxed text-muted">{pending?.message}</div>
      </Sheet>
    </ToastCtx.Provider>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
      <p className="text-base font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Loading({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <p role="status" className="py-12 text-center text-sm text-muted">
      {label}
    </p>
  );
}

export function ImagePicker({ label, value, onPick, onClear, hint, checkered }: { label: string; value?: string; onPick: (f: File) => void; onClear: () => void; hint?: string; checkered?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <div
        className={`grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line ${checkered ? 'bg-[conic-gradient(#e5e5e5_25%,#fff_0_50%,#e5e5e5_0_75%,#fff_0)] bg-[length:12px_12px]' : 'bg-white'}`}
      >
        {value ? <img src={value} alt={label} className="max-h-full max-w-full object-contain" /> : <span className="px-1 text-center text-[11px] text-[#57534e]">Belum ada</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <label
            htmlFor={id}
            className="inline-flex min-h-9 cursor-pointer items-center rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:bg-sunken focus-within:outline-2 focus-within:outline-[var(--focus)]"
          >
            {value ? 'Ganti' : 'Pilih gambar'}
            <input
              id={id}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPick(f);
                e.target.value = '';
              }}
            />
          </label>
          {value && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Hapus
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
