import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { App } from './App';
import { UIProvider } from './components/ui';

// A PWA left open for days never navigates, so it would never notice a new deploy on its own.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => navigator.onLine && reg.update().catch(() => undefined);
    setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UIProvider>
        <App />
      </UIProvider>
    </BrowserRouter>
  </StrictMode>,
);
