import { useEffect, useId, useState } from 'react';
import type { DateRange, Lang, YM } from '../types';
import { monthNames, nowYM, ymValue } from '../lib/dates';
import { Select, TextInput } from '../components/ui';

export function YMInput({ value, onChange, label, lang = 'id', disabled }: { value: YM; onChange: (v: YM) => void; label: string; lang?: Lang; disabled?: boolean }) {
  const id = useId();
  const [year, setYear] = useState(value.y ? String(value.y) : '');
  useEffect(() => {
    setYear(value.y ? String(value.y) : '');
  }, [value.y]);
  const maxYear = nowYM().y! + 8;
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-1.5 text-[13px] font-semibold">{label}</legend>
      <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
        <Select aria-label={`${label}: bulan`} value={value.m ?? ''} onChange={(e) => onChange({ ...value, m: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">Bulan</option>
          {monthNames(lang, true).map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </Select>
        <TextInput
          id={id}
          aria-label={`${label}: tahun`}
          inputMode="numeric"
          maxLength={4}
          placeholder="Tahun"
          value={year}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
            setYear(raw);
            const n = Number(raw);
            if (!raw) onChange({ ...value, y: undefined });
            else if (raw.length === 4 && n >= 1950 && n <= maxYear) onChange({ ...value, y: n });
          }}
          onBlur={() => setYear(value.y ? String(value.y) : '')}
          className="text-center"
        />
      </div>
    </fieldset>
  );
}

export function RangeInput({
  value,
  onChange,
  single,
  currentLabel = 'Masih berlangsung',
  lang,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
  single?: boolean;
  currentLabel?: string;
  lang?: Lang;
}) {
  const id = useId();
  if (single) return <YMInput label="Tanggal" value={value.end.y ? value.end : value.start} onChange={(end) => onChange({ start: {}, end, current: false })} lang={lang} />;
  const reversed = !value.current && ymValue(value.end) < ymValue(value.start);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <YMInput label="Mulai" value={value.start} onChange={(start) => onChange({ ...value, start })} lang={lang} />
        {value.current ? (
          <div className="flex flex-col">
            <span className="mb-1.5 text-[13px] font-semibold">Selesai</span>
            <span className="flex min-h-11 items-center rounded-xl border border-dashed border-line px-3 text-sm text-muted">{lang === 'en' ? 'Present' : 'Sekarang'}</span>
          </div>
        ) : (
          <YMInput label="Selesai" value={value.end} onChange={(end) => onChange({ ...value, end })} lang={lang} />
        )}
      </div>
      <label htmlFor={id} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm">
        <input id={id} type="checkbox" className="size-4.5 accent-[var(--brand)]" checked={value.current} onChange={(e) => onChange({ ...value, current: e.target.checked })} />
        {currentLabel}
      </label>
      {reversed && <p className="text-xs font-semibold text-danger">Tanggal selesai lebih awal dari tanggal mulai.</p>}
    </div>
  );
}

export function LevelInput({ value, onChange, names, label }: { value: number; onChange: (n: number) => void; names: string[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} – ${names[n]}`}
          title={names[n]}
          onClick={() => onChange(value === n ? 0 : n)}
          className="grid size-8 place-items-center rounded-lg hover:bg-sunken"
        >
          <span className={`block size-3.5 rounded-full border-2 ${n <= value ? 'border-brand bg-brand' : 'border-line bg-transparent'}`} />
        </button>
      ))}
      <span className="ml-1 min-w-16 text-xs text-muted">{value ? names[value] : 'Tanpa level'}</span>
    </div>
  );
}
