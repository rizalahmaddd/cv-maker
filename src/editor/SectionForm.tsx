import { useContext, useId, useState } from 'react';
import { EditorCtx } from './context';
import type { Entry, Lang, Section } from '../types';
import { Button, Field, Select, TextArea, TextInput, useUI } from '../components/ui';
import { IconChevronDown, IconCopy, IconEye, IconEyeOff, IconPlus, IconSort, IconTrash, IconWand } from '../components/icons';
import { emptyEntry } from '../db';
import { uid } from '../lib/id';
import { compareRangeDesc, formatRange, formatYM } from '../lib/dates';
import { normalizeText, splitList } from '../lib/text';
import { LANGUAGE_LEVELS, LEVEL_NAMES, SECTION_DEFS, type EntryField } from '../presets/sections';
import { LevelInput, RangeInput } from './fields';
import { DEGREES, decimalInput, SCHOOL_LEVELS, SCORE_SCALES } from '../presets/personal';
import { DragHandle, SortableList } from './Sortable';
import { BulletEditor } from './BulletEditor';
import { FamilySelect, PhraseSheet, useFamily } from './PhraseSheet';
import { FAMILIES } from '../presets/phrases';

type Change = (fn: (s: Section) => Section, key?: string) => void;

function entrySummary(e: Entry, s: Section, lang: Lang) {
  const def = SECTION_DEFS[s.type];
  const date = def.singleDate ? formatYM(e.range.end.y ? e.range.end : e.range.start, lang, 'short') : formatRange(e.range, lang, 'short');
  return { main: e.title.trim() || e.subtitle.trim() || 'Belum diisi', sub: [e.title.trim() ? e.subtitle.trim() : '', date].filter(Boolean).join(' · ') };
}

function DetailsInput({ value, onChange, label, placeholder, tip }: { value: string; onChange: (v: string) => void; label: string; placeholder?: string; tip?: boolean }) {
  const count = value.split('\n').filter((l) => l.trim()).length;
  const [ideas, setIdeas] = useState(false);
  const { toast } = useUI();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold">{label}</span>
        {tip && (
          <Button size="sm" variant="ghost" onClick={() => setIdeas(true)} className="-my-1">
            <IconWand size={16} /> Ide kalimat
          </Button>
        )}
      </div>
      {tip && (
        <PhraseSheet
          open={ideas}
          onClose={() => setIdeas(false)}
          kind="bullets"
          onPick={(t) => {
            onChange(value.trim() ? `${value.replace(/\n+$/, '')}\n${t}` : t);
            toast('Poin ditambahkan. Sesuaikan bagian dalam [kurung].');
          }}
        />
      )}
      <BulletEditor value={value} onChange={onChange} placeholder={placeholder} label={label} />
      <p className="text-xs text-muted">
        {count > 1 ? `${count} poin. ` : ''}Tekan Enter untuk poin baru.{tip ? ' Awali dengan kata kerja dan sertakan angka bila bisa.' : ''}
      </p>
    </div>
  );
}

function EducationFields({ entry, onChange }: { entry: Entry; onChange: (patch: Partial<Entry>, key: string) => void }) {
  const base = useId();
  const max = entry.scoreMax || '4';
  const n = Number(entry.score);
  const over = !!entry.score && n > Number(max);
  const school = !!entry.degree && SCHOOL_LEVELS.has(entry.degree);
  return (
    <>
      <Field label="Jenjang" htmlFor={`${base}-deg`}>
        <Select
          id={`${base}-deg`}
          value={entry.degree ?? ''}
          onChange={(e) => onChange({ degree: e.target.value, scoreMax: SCHOOL_LEVELS.has(e.target.value) ? '100' : entry.scoreMax === '100' ? '4' : entry.scoreMax }, '')}
        >
          <option value="">Pilih jenjang</option>
          {Object.entries(DEGREES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.id}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={school ? 'Nilai rata-rata (opsional)' : 'IPK (opsional)'}
        htmlFor={`${base}-gpa`}
        hint={over ? <span className="font-semibold text-danger">Nilai melebihi skala {max}.</span> : undefined}
      >
        <div className="grid grid-cols-[1fr_6.5rem] gap-2">
          <TextInput
            id={`${base}-gpa`}
            inputMode="decimal"
            placeholder={max === '100' ? '85' : '3,50'}
            aria-invalid={over}
            value={(entry.score ?? '').replace('.', ',')}
            onChange={(e) => onChange({ score: decimalInput(e.target.value) }, `${entry.id}.score`)}
          />
          <Select aria-label="Skala nilai" value={max} onChange={(e) => onChange({ scoreMax: e.target.value }, '')}>
            {SCORE_SCALES.map((sc) => (
              <option key={sc} value={sc}>
                / {sc === '100' ? '100' : `${sc},00`}
              </option>
            ))}
          </Select>
        </div>
      </Field>
    </>
  );
}

function EntryFields({ entry, section, onChange }: { entry: Entry; section: Section; onChange: (patch: Partial<Entry>, key: string) => void }) {
  const { lang } = useContext(EditorCtx);
  const def = SECTION_DEFS[section.type];
  const f = def.fields;
  const base = useId();
  const text = (key: EntryField & keyof Entry, opts: { inputMode?: 'url' | 'text' } = {}) => {
    const meta = f[key];
    if (!meta) return null;
    const options = def.options?.[key];
    if (options) {
      const value = entry[key] as string;
      return (
        <Field label={meta.label} htmlFor={`${base}-${key}`}>
          <Select id={`${base}-${key}`} value={value} onChange={(e) => onChange({ [key]: e.target.value }, '')}>
            <option value="">Tidak dicantumkan</option>
            {value && !options[value] && <option value={value}>{value}</option>}
            {Object.entries(options).map(([k, v]) => (
              <option key={k} value={k}>
                {v.id}
              </option>
            ))}
          </Select>
        </Field>
      );
    }
    return (
      <Field label={meta.label} htmlFor={`${base}-${key}`}>
        <TextInput
          id={`${base}-${key}`}
          value={entry[key] as string}
          placeholder={meta.placeholder}
          inputMode={opts.inputMode}
          onChange={(e) => onChange({ [key]: normalizeText(e.target.value) }, `${entry.id}.${key}`)}
        />
      </Field>
    );
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {text('title')}
        {section.type === 'education' && <EducationFields entry={entry} onChange={onChange} />}
        {text('subtitle')}
        {text('location')}
        {text('extra')}
        {text('link', { inputMode: 'url' })}
      </div>
      {f.range && <RangeInput value={entry.range} single={def.singleDate} lang={lang} onChange={(range) => onChange({ range }, `${entry.id}.range`)} />}
      {f.details && (
        <DetailsInput
          tip={['experience', 'internship', 'organization', 'volunteer', 'projects'].includes(section.type)}
          label={f.details.label}
          placeholder={f.details.placeholder}
          value={entry.details}
          onChange={(details) => onChange({ details }, `${entry.id}.details`)}
        />
      )}
    </div>
  );
}

function EntriesSection({ section, onChange, openId, setOpenId }: { section: Section; onChange: Change; openId: string | null; setOpenId: (id: string | null) => void }) {
  const { lang, undo } = useContext(EditorCtx);
  const { toast } = useUI();
  const def = SECTION_DEFS[section.type];
  const setEntry = (id: string, patch: Partial<Entry>, key: string) => onChange((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }), key);
  const add = () => {
    const e = emptyEntry();
    onChange((s) => ({ ...s, entries: [...s.entries, e] }));
    setOpenId(e.id);
  };
  const remove = (e: Entry) => {
    onChange((s) => ({ ...s, entries: s.entries.filter((x) => x.id !== e.id) }));
    toast('Isian dihapus.', 'ok', { label: 'Urungkan', onClick: undo });
  };
  const duplicate = (e: Entry) => {
    const copy = { ...structuredClone(e), id: uid() };
    onChange((s) => {
      const i = s.entries.findIndex((x) => x.id === e.id);
      const entries = [...s.entries];
      entries.splice(i + 1, 0, copy);
      return { ...s, entries };
    });
    setOpenId(copy.id);
  };
  const sortByDate = () => onChange((s) => ({ ...s, entries: [...s.entries].sort((a, b) => compareRangeDesc(a.range, b.range)) }));

  return (
    <div className="flex flex-col gap-3">
      {section.entries.length > 1 && def.fields.range && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={sortByDate}>
            <IconSort size={16} /> Urutkan dari terbaru
          </Button>
        </div>
      )}
      <SortableList items={section.entries} onReorder={(entries) => onChange((s) => ({ ...s, entries }))} className="flex flex-col gap-2.5">
        {(e, handle, dragging) => {
          const open = openId === e.id;
          const sum = entrySummary(e, section, lang);
          return (
            <div className={`rounded-2xl border bg-surface ${dragging ? 'border-brand shadow-lg' : 'border-line'} ${e.hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-1 p-1.5">
                <DragHandle handle={handle} label={`Pindahkan ${sum.main}`} />
                <button type="button" onClick={() => setOpenId(open ? null : e.id)} aria-expanded={open} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left">
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-bold ${e.title.trim() || e.subtitle.trim() ? '' : 'text-muted'}`}>{sum.main}</span>
                    {sum.sub ? <span className="block truncate text-xs text-muted">{sum.sub}</span> : null}
                  </span>
                  {e.hidden ? <IconEyeOff size={16} className="shrink-0 text-muted" aria-label="Disembunyikan" /> : null}
                  <IconChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {open && (
                <div className="border-t border-line px-3 pt-3 pb-2 sm:px-4">
                  <EntryFields entry={e} section={section} onChange={(patch, key) => setEntry(e.id, patch, key)} />
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-2">
                    <Button size="sm" variant="ghost" onClick={() => setEntry(e.id, { hidden: !e.hidden }, '')}>
                      {e.hidden ? <IconEye size={16} /> : <IconEyeOff size={16} />} {e.hidden ? 'Tampilkan' : 'Sembunyikan'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicate(e)}>
                      <IconCopy size={16} /> Duplikat
                    </Button>
                    <Button size="sm" variant="ghost" className="ml-auto text-danger" onClick={() => remove(e)}>
                      <IconTrash size={16} /> Hapus
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </SortableList>
      <Button onClick={add} block className="border-dashed">
        <IconPlus size={18} /> {def.addLabel ?? 'Tambah'}
      </Button>
    </div>
  );
}

function ListSection({ section, onChange }: { section: Section; onChange: Change }) {
  const { lang, undo } = useContext(EditorCtx);
  const { toast } = useUI();
  const def = SECTION_DEFS[section.type];
  const [bulk, setBulk] = useState('');
  const bulkId = useId();
  const names = section.type === 'languages' ? LANGUAGE_LEVELS.id : LEVEL_NAMES.id;
  const setEntry = (id: string, patch: Partial<Entry>, key: string) => onChange((s) => ({ ...s, entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) }), key);
  const addMany = () => {
    const items = splitList(bulk);
    if (!items.length) return;
    const existing = new Set(section.entries.map((e) => e.title.trim().toLowerCase()));
    const fresh = items.filter((t) => !existing.has(t.toLowerCase())).map((title) => emptyEntry({ title }));
    onChange((s) => ({ ...s, entries: [...s.entries, ...fresh] }));
    setBulk('');
    if (fresh.length < items.length) toast(`${items.length - fresh.length} sudah ada, tidak ditambahkan lagi.`);
  };
  const remove = (e: Entry) => {
    onChange((s) => ({ ...s, entries: s.entries.filter((x) => x.id !== e.id) }));
    toast(`"${e.title || 'Isian'}" dihapus.`, 'ok', { label: 'Urungkan', onClick: undo });
  };
  return (
    <div className="flex flex-col gap-3">
      <SortableList items={section.entries} onReorder={(entries) => onChange((s) => ({ ...s, entries }))} className="flex flex-col gap-2">
        {(e, handle, dragging) => (
          <div className={`rounded-2xl border bg-surface p-1.5 ${dragging ? 'border-brand shadow-lg' : 'border-line'}`}>
            <div className="flex items-center gap-1">
              <DragHandle handle={handle} label={`Pindahkan ${e.title || 'isian'}`} />
              <TextInput
                aria-label={def.fields.title?.label}
                value={e.title}
                placeholder={def.fields.title?.placeholder}
                onChange={(ev) => setEntry(e.id, { title: normalizeText(ev.target.value) }, `${e.id}.title`)}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => remove(e)}
                aria-label={`Hapus ${e.title || 'isian'}`}
                className="inline-grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-danger"
              >
                <IconTrash size={17} />
              </button>
            </div>
            {(def.fields.level || def.fields.subtitle || def.fields.extra) && (
              <div className="mt-1.5 grid gap-2 pl-11 pr-1 pb-1 sm:grid-cols-2">
                {def.fields.subtitle && (
                  <TextInput
                    aria-label={def.fields.subtitle.label}
                    placeholder={def.fields.subtitle.label + (def.fields.subtitle.placeholder ? `, mis. ${def.fields.subtitle.placeholder}` : '')}
                    value={e.subtitle}
                    onChange={(ev) => setEntry(e.id, { subtitle: normalizeText(ev.target.value) }, `${e.id}.subtitle`)}
                  />
                )}
                {def.fields.extra && (
                  <TextInput
                    aria-label={def.fields.extra.label}
                    placeholder={def.fields.extra.placeholder ?? def.fields.extra.label}
                    value={e.extra}
                    onChange={(ev) => setEntry(e.id, { extra: normalizeText(ev.target.value) }, `${e.id}.extra`)}
                  />
                )}
                {def.fields.level && <LevelInput label={`Tingkat ${e.title}`} value={e.level} names={names} onChange={(level) => setEntry(e.id, { level }, '')} />}
              </div>
            )}
          </div>
        )}
      </SortableList>
      <div className="rounded-2xl border border-dashed border-line p-3">
        <label htmlFor={bulkId} className="text-[13px] font-semibold">
          {def.addLabel}
        </label>
        <div className="mt-1.5 flex gap-2">
          <TextInput
            id={bulkId}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMany();
              }
            }}
            placeholder={section.type === 'skills' ? 'Excel, Canva, Public speaking' : def.fields.title?.placeholder}
          />
          <Button onClick={addMany} disabled={!bulk.trim()} aria-label="Tambahkan">
            <IconPlus size={18} />
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted">Pisahkan dengan koma untuk menambah beberapa sekaligus.</p>
      </div>
      {section.type === 'skills' && <SkillSuggestions section={section} onChange={onChange} />}
      {lang === 'en' && section.type === 'languages' ? <p className="text-xs text-muted">Tip: untuk CV internasional, tulis level CEFR (A1–C2) atau skor tes resmi.</p> : null}
    </div>
  );
}

function SkillSuggestions({ section, onChange }: { section: Section; onChange: Change }) {
  const [family, setFamily] = useFamily();
  const have = new Set(section.entries.map((e) => e.title.trim().toLowerCase()));
  const list = (FAMILIES.find((f) => f.key === family) ?? FAMILIES[0]).skills.filter((k) => !have.has(k.toLowerCase()));
  return (
    <div className="rounded-2xl bg-sunken/60 p-3">
      <p className="mb-2 text-[13px] font-semibold">Saran keahlian</p>
      <FamilySelect value={family} onChange={setFamily} />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {list.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange((s) => ({ ...s, entries: [...s.entries, emptyEntry({ title: k })] }))}
            className="min-h-9 rounded-full border border-line bg-surface px-3 text-xs font-semibold hover:border-brand"
          >
            + {k}
          </button>
        ))}
        {!list.length && <p className="text-xs text-muted">Semua saran untuk bidang ini sudah ditambahkan.</p>}
      </div>
    </div>
  );
}

function TextSection({ section, onChange }: { section: Section; onChange: Change }) {
  const id = useId();
  const { undo } = useContext(EditorCtx);
  const { toast } = useUI();
  const [examples, setExamples] = useState(false);
  const words = section.text.trim() ? section.text.trim().split(/\s+/).length : 0;
  return (
    <>
      <Field label="Isi" htmlFor={id} hint={`${words} kata. Ideal 40–90 kata.`}>
        <TextArea id={id} rows={5} value={section.text} onChange={(e) => onChange((s) => ({ ...s, text: normalizeText(e.target.value) }), `${section.id}.text`)} />
      </Field>
      {section.type === 'summary' && (
        <>
          <Button onClick={() => setExamples(true)} className="self-start">
            <IconWand size={17} /> Lihat contoh ringkasan
          </Button>
          <PhraseSheet
            open={examples}
            onClose={() => setExamples(false)}
            kind="summary"
            onPick={(t) => {
              const had = !!section.text.trim();
              onChange((s) => ({ ...s, text: t }));
              toast('Contoh dipakai. Ganti bagian dalam [kurung] dengan data Anda.', 'ok', had ? { label: 'Urungkan', onClick: undo } : undefined);
            }}
          />
        </>
      )}
    </>
  );
}

export function SectionForm({ section, onChange }: { section: Section; onChange: Change }) {
  const def = SECTION_DEFS[section.type];
  const { lang } = useContext(EditorCtx);
  const titleId = useId();
  const [openId, setOpenId] = useState<string | null>(() => (section.entries.length === 1 ? section.entries[0].id : null));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{def.hint}</p>
      <Field label="Judul bagian di CV" htmlFor={titleId} hint="Kosongkan untuk memakai judul bawaan.">
        <TextInput id={titleId} value={section.title} placeholder={def.name[lang]} onChange={(e) => onChange((s) => ({ ...s, title: e.target.value }), `${section.id}.title`)} />
      </Field>
      {def.kind === 'text' && <TextSection section={section} onChange={onChange} />}
      {def.kind === 'entries' && <EntriesSection section={section} onChange={onChange} openId={openId} setOpenId={setOpenId} />}
      {def.kind === 'list' && <ListSection section={section} onChange={onChange} />}
    </div>
  );
}
