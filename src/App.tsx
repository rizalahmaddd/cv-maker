import { useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout';
import { EmptyState } from './components/ui';
import { useSettings } from './hooks';
import { requestPersistentStorage } from './db';
import { CvList } from './pages/CvList';
import { NewCv } from './pages/NewCv';
import { ImportCv } from './pages/ImportCv';
import { CvEditor } from './pages/CvEditor';
import { CvView } from './pages/CvView';
import { Templates } from './pages/Templates';
import { TemplateEditor } from './pages/TemplateEditor';
import { SettingsPage } from './pages/Settings';
import { Letters } from './pages/Letters';
import { LetterEditor } from './pages/LetterEditor';
import { Applications } from './pages/Applications';

export function App() {
  const settings = useSettings();

  useEffect(() => {
    const pref = settings?.theme;
    if (!pref) return;
    const root = document.documentElement;
    if (pref === 'system') delete root.dataset.theme;
    else root.dataset.theme = pref;
    try {
      localStorage.setItem('theme', pref);
    } catch {
      /* private mode */
    }
  }, [settings?.theme]);

  useEffect(() => {
    requestPersistentStorage().catch(() => undefined);
  }, []);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<CvList />} />
        <Route path="/baru" element={<NewCv />} />
        <Route path="/impor" element={<ImportCv />} />
        <Route path="/cv/:id" element={<CvEditor />} />
        <Route path="/cv/:id/lihat" element={<CvView />} />
        <Route path="/template" element={<Templates />} />
        <Route path="/template/:id" element={<TemplateEditor />} />
        <Route path="/surat" element={<Letters />} />
        <Route path="/surat/:id" element={<LetterEditor />} />
        <Route path="/lamaran" element={<Applications />} />
        <Route path="/pengaturan" element={<SettingsPage />} />
        <Route
          path="*"
          element={
            <EmptyState
              title="Halaman tidak ditemukan"
              body="Alamat ini tidak ada di aplikasi."
              action={
                <Link to="/" className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-bg">
                  Ke daftar CV
                </Link>
              }
            />
          }
        />
      </Routes>
    </AppShell>
  );
}
