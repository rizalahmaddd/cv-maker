import { useContext } from 'react';
import { Button, Select, Sheet } from '../components/ui';
import { useStoredState } from '../hooks';
import { ACTION_VERBS, FAMILIES } from '../presets/phrases';
import { EditorCtx } from './context';

export type PhraseKind = 'summary' | 'bullets' | 'skills';

export function useFamily() {
  return useStoredState('cv:family', FAMILIES[0].key);
}

export function FamilySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select aria-label="Bidang pekerjaan" value={value} onChange={(e) => onChange(e.target.value)}>
      {FAMILIES.map((f) => (
        <option key={f.key} value={f.key}>
          {f.name}
        </option>
      ))}
    </Select>
  );
}

export function PhraseSheet({ open, onClose, kind, onPick }: { open: boolean; onClose: () => void; kind: Exclude<PhraseKind, 'skills'>; onPick: (text: string) => void }) {
  const { lang } = useContext(EditorCtx);
  const [family, setFamily] = useFamily();
  const f = FAMILIES.find((x) => x.key === family) ?? FAMILIES[0];
  const items = kind === 'summary' ? f.summary[lang] : f.bullets[lang];
  return (
    <Sheet open={open} onClose={onClose} title={kind === 'summary' ? 'Contoh ringkasan' : 'Ide kalimat pengalaman'} size="lg">
      <div className="flex flex-col gap-4">
        <FamilySelect value={family} onChange={setFamily} />
        <p className="text-xs text-muted">Ganti bagian dalam [kurung siku] dengan data Anda sendiri. Jangan mencantumkan hal yang tidak benar-benar Anda lakukan.</p>
        <ul className="flex flex-col gap-2">
          {items.map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-xl border border-line p-3">
              <p className="flex-1 text-sm leading-relaxed">{t}</p>
              <Button
                size="sm"
                onClick={() => {
                  onPick(t);
                  if (kind === 'summary') onClose();
                }}
              >
                Pakai
              </Button>
            </li>
          ))}
        </ul>
        {kind === 'bullets' && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted">Kata kerja pembuka yang kuat</p>
            <div className="flex flex-wrap gap-1.5">
              {ACTION_VERBS[lang].map((v) => (
                <span key={v} className="rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
