import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { updateSettings } from '../db';
import { useSettings } from '../hooks';
import { IconBack, IconBriefcase, IconDoc, IconGear, IconLayout, IconLetter, IconMoon, IconPlus, IconSidebar, IconSun } from './icons';

const NAV = [
  { to: '/', label: 'CV Saya', icon: IconDoc, end: true },
  { to: '/surat', label: 'Surat', icon: IconLetter },
  { to: '/lamaran', label: 'Lamaran', icon: IconBriefcase },
  { to: '/template', label: 'Template', icon: IconLayout },
  { to: '/pengaturan', label: 'Pengaturan', icon: IconGear },
];

export function AppShell({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Editors bring their own bottom action bar on phones.
  const immersive = /^\/(cv|surat|template)\/[^/]+$/.test(pathname);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {
        /* private mode fallback */
      }
      return next;
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleTheme = () => {
    const cur = settings?.theme ?? 'system';
    const next = cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    updateSettings({ theme: next });
  };

  const handleNew = () => navigate('/baru');

  return (
    <div className="min-h-dvh bg-bg text-text selection:bg-brand/20 selection:text-brand flex" style={{ ['--sidebar-w' as string]: collapsed ? '5rem' : '16rem' }}>
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-30 border-r border-line bg-surface select-none transition-[width] duration-200 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex h-16 items-center border-b border-line/60 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {collapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              title="Perluas sidebar (Ctrl+B)"
              aria-label="Perluas sidebar"
              className="group relative flex size-10 items-center justify-center rounded-xl bg-ink font-mono text-sm font-extrabold text-bg shadow-xs transition-all hover:scale-105 hover:shadow-md"
            >
              <span className="transition-opacity group-hover:hidden">CV</span>
              <span className="hidden group-hover:flex items-center justify-center">
                <IconSidebar size={18} />
              </span>
            </button>
          ) : (
            <>
              <NavLink to="/" className="group flex items-center gap-2.5 min-w-0" title="CV Maker">
                <span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-ink font-mono text-sm font-extrabold text-bg transition-transform group-hover:scale-105 shadow-xs">
                  CV
                </span>
                <div className="min-w-0 overflow-hidden">
                  <span className="block text-base font-extrabold tracking-tight leading-none text-text">
                    CV Maker<span className="text-brand">.</span>
                  </span>
                  <span className="block text-[11px] text-muted truncate mt-1">CV & surat lamaran</span>
                </div>
              </NavLink>

              <button
                type="button"
                onClick={toggleCollapsed}
                title="Ciutkan sidebar (Ctrl+B)"
                aria-label="Ciutkan sidebar"
                className="inline-grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-text"
              >
                <IconSidebar size={17} />
              </button>
            </>
          )}
        </div>
        <div className={`pb-2 ${collapsed ? 'p-2' : 'p-4'}`}>
          <button
            type="button"
            onClick={handleNew}
            title="Buat CV baru"
            className={`flex items-center justify-center gap-2 rounded-xl bg-ink font-bold text-bg shadow-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${
              collapsed ? 'size-11 mx-auto' : 'w-full py-2.5 px-4 text-sm'
            }`}
          >
            <IconPlus size={18} />
            {!collapsed && <span>Buat CV</span>}
          </button>
        </div>
        <nav aria-label="Navigasi utama desktop" className={`flex-1 flex flex-col gap-1.5 ${collapsed ? 'px-2 py-2' : 'px-3 py-2'}`}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl transition-all ${collapsed ? 'size-11 mx-auto justify-center' : 'gap-3 px-3.5 py-2.5 text-sm font-semibold'} ${
                  isActive ? 'bg-sunken text-text shadow-2xs font-bold' : 'text-muted hover:bg-sunken/60 hover:text-text'
                }`
              }
            >
              <n.icon size={19} />
              {!collapsed && <span>{n.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className={`border-t border-line/70 flex flex-col gap-2 ${collapsed ? 'p-2' : 'p-4'}`}>
          <button
            type="button"
            onClick={toggleTheme}
            title={`Ubah tema (saat ini: ${settings?.theme ?? 'system'})`}
            className={`flex items-center rounded-xl border border-line bg-surface text-xs font-semibold text-muted transition-colors hover:bg-sunken hover:text-text ${
              collapsed ? 'size-11 mx-auto justify-center p-0' : 'justify-between w-full px-3 py-2'
            }`}
          >
            <span className="flex items-center gap-2">
              {settings?.theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
              {!collapsed && <span>Mode {settings?.theme === 'dark' ? 'Gelap' : 'Terang'}</span>}
            </span>
            {!collapsed && <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sunken text-muted">Ubah</span>}
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Perluas sidebar (Ctrl+B)' : 'Ciutkan sidebar (Ctrl+B)'}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            className={`flex items-center rounded-xl border border-line bg-surface text-xs font-semibold text-muted transition-colors hover:bg-sunken hover:text-text ${
              collapsed ? 'size-11 mx-auto justify-center p-0' : 'justify-between w-full px-3 py-2'
            }`}
          >
            <span className="flex items-center gap-2">
              <IconSidebar size={16} />
              {!collapsed && <span>Ciutkan sidebar</span>}
            </span>
            {!collapsed && <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sunken text-muted">Ctrl+B</kbd>}
          </button>

          {!collapsed ? (
            <div className="flex items-center gap-2 px-1 pt-1 text-[11px] text-muted">
              <span className="size-2 rounded-full bg-ok shrink-0" />
              <span className="truncate">Tersimpan lokal di browser</span>
            </div>
          ) : (
            <div className="flex justify-center pt-1" title="Tersimpan lokal di browser">
              <span className="size-2 rounded-full bg-ok" />
            </div>
          )}
        </div>
      </aside>
      <div className={`flex-1 min-w-0 flex flex-col transition-[padding] duration-200 ease-in-out ${collapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <main className={`flex-1 mx-auto w-full max-w-7xl px-4 pt-4 md:px-8 md:pt-8 md:pb-16 ${immersive ? 'pb-24' : 'pb-28'}`}>{children}</main>
      </div>
      <nav aria-label="Navigasi utama mobile" className={`pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden ${immersive ? 'hidden' : ''}`}>
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${isActive ? 'text-brand font-bold' : 'text-muted'}`}
            >
              {({ isActive }) => (
                <>
                  <n.icon size={20} />
                  <span className={isActive ? 'font-bold' : ''}>{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ title, back, actions, sub }: { title: ReactNode; back?: string | true; actions?: ReactNode; sub?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-h-12 items-center gap-2">
        {back && (
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => (back === true ? navigate(-1) : navigate(back))}
            className="-ml-2 inline-grid size-11 place-items-center rounded-xl text-text hover:bg-sunken transition-colors"
          >
            <IconBack />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight md:text-2xl">{title}</h1>
          {sub && <div className="mt-0.5 truncate text-sm text-muted">{sub}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
