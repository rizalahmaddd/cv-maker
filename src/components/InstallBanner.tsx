import { useEffect, useState } from 'react';
import { Button } from './ui';
import { IconClose } from './icons';
import { useStoredState } from '../hooks';
import { isIOS, isStandalone } from '../lib/env';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as InstallEvent;
});

// Safari evicts storage of sites that are not installed after 7 days without a visit, so iPhone users get the nudge too.
export function InstallBanner() {
  const [dismissed, setDismissed] = useStoredState('cv:install-dismissed', false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(deferred);
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallEvent;
      setPrompt(deferred);
    };
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);
  if (dismissed || isStandalone()) return null;
  const ios = isIOS();
  if (!prompt && !ios) return null;
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-line bg-surface p-4">
      <img src="/pwa-192.png" alt="" className="size-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold">Pasang CV Maker di layar utama</p>
        <p className="text-muted">
          {ios
            ? 'Di Safari, ketuk tombol Bagikan lalu "Tambahkan ke Layar Utama". Data lebih awet dan bisa dibuka tanpa internet.'
            : 'Buka lebih cepat, bisa dipakai tanpa internet, dan data lebih aman tersimpan.'}
        </p>
        {prompt && (
          <Button
            size="sm"
            variant="primary"
            className="mt-2"
            onClick={async () => {
              await prompt.prompt();
              const r = await prompt.userChoice;
              if (r.outcome === 'accepted') setDismissed(true);
              deferred = null;
              setPrompt(null);
            }}
          >
            Pasang
          </Button>
        )}
      </div>
      <button type="button" aria-label="Tutup" onClick={() => setDismissed(true)} className="-m-1 inline-grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-sunken">
        <IconClose size={16} />
      </button>
    </div>
  );
}
