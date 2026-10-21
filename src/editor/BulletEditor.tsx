import { useEffect, useLayoutEffect, useRef } from 'react';
import { IconClose, IconPlus } from '../components/icons';
import { normalizeText, splitLines, stripBullet } from '../lib/text';

function Row({
  value,
  onChange,
  onEnter,
  onRemove,
  onPasteLines,
  focus,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: (before: string, after: string) => void;
  onRemove: (merge: string) => void;
  onPasteLines: (lines: string[], before: string, after: string) => void;
  focus: { at: number } | null;
  placeholder?: string;
  label: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  useEffect(() => {
    if (!focus || !ref.current) return;
    ref.current.focus();
    const at = Math.min(focus.at, ref.current.value.length);
    ref.current.setSelectionRange(at, at);
  }, [focus]);
  return (
    <div className="group flex items-start gap-1.5">
      <span aria-hidden="true" className="mt-[11px] size-1.5 shrink-0 rounded-full bg-muted" />
      <textarea
        ref={ref}
        rows={1}
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => onChange(normalizeText(e.target.value).replace(/\n/g, ' '))}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onEnter(value.slice(0, el.selectionStart), value.slice(el.selectionEnd));
          } else if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
            e.preventDefault();
            onRemove(value);
          }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          const lines = splitLines(text).map(stripBullet).filter(Boolean);
          if (lines.length < 2) return;
          e.preventDefault();
          const el = e.currentTarget;
          onPasteLines(lines, value.slice(0, el.selectionStart), value.slice(el.selectionEnd));
        }}
        className="min-h-9 w-full resize-none overflow-hidden border-0 border-b border-transparent bg-transparent px-1 py-1.5 leading-snug text-text placeholder:text-muted/70 focus:border-brand focus:outline-none focus-visible:outline-none"
      />
      <button
        type="button"
        aria-label="Hapus poin"
        onClick={() => onRemove('')}
        className="mt-0.5 inline-grid size-8 shrink-0 place-items-center rounded-lg text-muted opacity-60 hover:bg-sunken hover:text-danger hover:opacity-100"
      >
        <IconClose size={15} />
      </button>
    </div>
  );
}

// Each bullet is its own field: on a phone a wrapped textarea hides where one point ends and the next begins.
export function BulletEditor({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder?: string; label: string }) {
  const items = value === '' ? [''] : value.split('\n');
  const focus = useRef<{ index: number; at: number } | null>(null);
  const commit = (next: string[], f?: { index: number; at: number }) => {
    focus.current = f ?? null;
    onChange(next.join('\n'));
  };
  const hints = (placeholder ?? '').split('\n');
  useEffect(() => {
    focus.current = null;
  });
  return (
    <div className="rounded-xl border border-line bg-surface px-2 py-1.5 focus-within:border-brand">
      {items.map((item, i) => (
        <Row
          key={i}
          value={item}
          label={`${label}, poin ${i + 1}`}
          placeholder={value === '' ? hints[i] : undefined}
          focus={focus.current?.index === i ? { at: focus.current.at } : null}
          onChange={(v) => commit(items.map((x, j) => (j === i ? v : x)))}
          onEnter={(before, after) => commit([...items.slice(0, i), before, after, ...items.slice(i + 1)], { index: i + 1, at: 0 })}
          onRemove={(merge) => {
            if (items.length === 1) return commit([''], { index: 0, at: 0 });
            if (i === 0 && merge) return;
            const prev = items[i - 1] ?? '';
            const next = i === 0 ? items.slice(1) : [...items.slice(0, i - 1), prev + merge, ...items.slice(i + 1)];
            commit(next, { index: Math.max(0, i - 1), at: prev.length });
          }}
          onPasteLines={(lines, before, after) => {
            const pasted = [before + lines[0], ...lines.slice(1, -1), lines[lines.length - 1] + after];
            commit([...items.slice(0, i), ...pasted, ...items.slice(i + 1)], { index: i + pasted.length - 1, at: lines[lines.length - 1].length });
          }}
        />
      ))}
      <button
        type="button"
        onClick={() => commit([...items, ''], { index: items.length, at: 0 })}
        className="mt-0.5 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1.5 text-sm font-semibold text-muted hover:text-text"
      >
        <IconPlus size={15} /> Tambah poin
      </button>
    </div>
  );
}
