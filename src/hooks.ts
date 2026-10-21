import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { cvChannel, db, getAssetData, getSettings, normalizeCv, saveCv, StaleWriteError } from './db';
import { BUILTIN_TEMPLATES, normalizeTemplate } from './templates';
import type { Cv, Settings, TemplateConfig } from './types';

export function useSettings(): Settings | undefined {
  return useLiveQuery(() => getSettings(), []);
}

export function useAllTemplates(): TemplateConfig[] | undefined {
  return useLiveQuery(async () => {
    const custom = await db.templates.orderBy('updatedAt').reverse().toArray();
    return [...custom.map(normalizeTemplate), ...BUILTIN_TEMPLATES];
  }, []);
}

export function useTemplate(id: string | undefined): TemplateConfig | undefined {
  return useLiveQuery(async () => {
    const builtin = BUILTIN_TEMPLATES.find((t) => t.id === id);
    if (builtin) return builtin;
    const custom = id ? await db.templates.get(id) : undefined;
    return custom ? normalizeTemplate(custom) : BUILTIN_TEMPLATES[0];
  }, [id]);
}

export function useAsset(id: string | undefined): string | undefined | null {
  return useLiveQuery(async () => (id ? ((await getAssetData(id)) ?? null) : null), [id]);
}

export type SaveState = 'saved' | 'pending' | 'error' | 'conflict';

interface History {
  past: Cv[];
  future: Cv[];
  key: string;
  at: number;
}

const SAVE_DELAY = 400;
const HISTORY_LIMIT = 80;

// The editor owns a local copy and writes it back on a short debounce; the revision check keeps a second tab
// from silently overwriting work saved in another one.
export function useCvEditor(id: string | undefined) {
  const [cv, setCv] = useState<Cv | null>(null);
  const [missing, setMissing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [, bump] = useState(0);
  const latest = useRef<Cv | null>(null);
  const baseRev = useRef(0);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const history = useRef<History>({ past: [], future: [], key: '', at: 0 });

  const load = useCallback(async () => {
    if (!id) return;
    const stored = await db.cvs.get(id);
    if (!stored) {
      setMissing(true);
      return;
    }
    const c = normalizeCv(stored);
    latest.current = c;
    baseRev.current = c.rev;
    dirty.current = false;
    setCv(c);
    setSaveState('saved');
  }, [id]);

  useEffect(() => {
    history.current = { past: [], future: [], key: '', at: 0 };
    load();
  }, [load]);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    const c = latest.current;
    if (!c || !dirty.current) return;
    dirty.current = false;
    try {
      const next = await saveCv(c, baseRev.current);
      baseRev.current = next.rev;
      cvChannel?.postMessage({ id: c.id, rev: next.rev });
      if (!dirty.current) setSaveState('saved');
    } catch (e) {
      dirty.current = true;
      setSaveState(e instanceof StaleWriteError ? 'conflict' : 'error');
    }
  }, []);

  const schedule = useCallback(() => {
    setSaveState((s) => (s === 'conflict' ? s : 'pending'));
    clearTimeout(timer.current);
    timer.current = setTimeout(save, SAVE_DELAY);
  }, [save]);

  const apply = useCallback(
    (next: Cv) => {
      latest.current = next;
      dirty.current = true;
      setCv(next);
      schedule();
    },
    [schedule],
  );

  // Keystrokes in the same field within a second collapse into one undo step.
  const update = useCallback(
    (fn: (c: Cv) => Cv, key = '') => {
      const prev = latest.current;
      if (!prev) return;
      const next = fn(prev);
      if (next === prev) return;
      const h = history.current;
      const now = Date.now();
      if (!(key && key === h.key && now - h.at < 1000)) {
        h.past = [...h.past.slice(-HISTORY_LIMIT + 1), prev];
      }
      h.future = [];
      h.key = key;
      h.at = now;
      apply(next);
    },
    [apply],
  );

  const undo = useCallback(() => {
    const h = history.current;
    const prev = h.past.pop();
    if (!prev || !latest.current) return;
    h.future.push(latest.current);
    h.key = '';
    apply(prev);
    bump((n) => n + 1);
  }, [apply]);

  const redo = useCallback(() => {
    const h = history.current;
    const next = h.future.pop();
    if (!next || !latest.current) return;
    h.past.push(latest.current);
    h.key = '';
    apply(next);
    bump((n) => n + 1);
  }, [apply]);

  const keepMine = useCallback(async () => {
    const stored = id ? await db.cvs.get(id) : undefined;
    baseRev.current = stored?.rev ?? baseRev.current;
    dirty.current = true;
    setSaveState('pending');
    await save();
  }, [id, save]);

  useEffect(() => {
    const flush = () => {
      if (dirty.current) save();
    };
    const onHide = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [save]);

  useEffect(() => {
    const channel = cvChannel;
    if (!channel) return;
    const onMsg = (e: MessageEvent<{ id: string; rev: number }>) => {
      if (e.data.id !== id || e.data.rev <= baseRev.current) return;
      if (dirty.current) setSaveState('conflict');
      else load();
    };
    channel.addEventListener('message', onMsg);
    return () => channel.removeEventListener('message', onMsg);
  }, [id, load]);

  return {
    cv,
    missing,
    saveState,
    update,
    undo,
    redo,
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
    reload: load,
    keepMine,
    flush: save,
  };
}

interface PdfState {
  blob: Blob | null;
  busy: boolean;
  error: string | null;
}

export function useCvPdf(cv: Cv | null | undefined, tpl: TemplateConfig | undefined, photo: string | undefined | null, delay = 450): PdfState {
  const [state, setState] = useState<PdfState>({ blob: null, busy: false, error: null });
  const run = useRef(0);
  useEffect(() => {
    if (!cv || !tpl || photo === undefined) return;
    const id = ++run.current;
    setState((s) => ({ ...s, busy: true }));
    const timer = setTimeout(async () => {
      try {
        const { renderCvPdf } = await import('./pdf/document');
        const blob = await renderCvPdf(cv, tpl, photo ?? undefined);
        if (id === run.current) setState({ blob, busy: false, error: null });
      } catch (e) {
        if (id === run.current) setState((s) => ({ ...s, busy: false, error: (e as Error).message || 'PDF gagal dibuat.' }));
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [cv, tpl, photo, delay]);
  return state;
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setMatch(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return match;
}

export function useStoredState<T>(key: string, initial: T, storage: 'local' | 'session' = 'local') {
  const store = () => (storage === 'local' ? localStorage : sessionStorage);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = store().getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      store().setItem(key, JSON.stringify(value));
    } catch {
      /* private mode */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
