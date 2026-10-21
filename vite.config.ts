import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Everything that decides how a PDF looks. Thumbnails are cached in the browser under this hash, so any
// change here invalidates them automatically instead of relying on someone remembering to bump a version.
const RENDER_SOURCES = ['src/pdf', 'src/lib', 'src/templates.ts', 'src/types.ts', 'src/components/TemplateThumb.tsx', 'src/presets/sample.ts', 'package-lock.json'];

function listFiles(path: string): string[] {
  if (!statSync(path, { throwIfNoEntry: false })) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path)
    .sort()
    .flatMap((f) => listFiles(join(path, f)));
}

function isRenderSource(file: string) {
  const rel = relative(process.cwd(), file).split(sep).join('/');
  return RENDER_SOURCES.some((src) => rel === src || rel.startsWith(src + '/'));
}

function renderVersion(): Plugin {
  const id = 'virtual:render-version';
  const resolved = '\0' + id;
  return {
    name: 'render-version',
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loaded) {
      if (loaded !== resolved) return;
      const hash = createHash('sha1');
      for (const f of RENDER_SOURCES.flatMap(listFiles)) hash.update(f).update(readFileSync(f));
      return `export default ${JSON.stringify(hash.digest('hex').slice(0, 10))};`;
    },
    // Fast Refresh only swaps the edited component; a full reload makes every module see the new hash at once.
    handleHotUpdate({ file, server }) {
      if (!isRenderSource(file)) return;
      const mod = server.moduleGraph.getModuleById(resolved);
      if (mod) server.moduleGraph.invalidateModule(mod);
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}

export default defineConfig({
  plugins: [
    renderVersion(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'CV Maker',
        short_name: 'CV Maker',
        description: 'Buat CV rapi dan siap ATS dari HP, tetap jalan tanpa internet.',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f6f6',
        theme_color: '#0a0a0a',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,mjs}'],
        // react-pdf and the pdf.js worker are bigger than the 2 MB default
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: '/index.html',
        // The Japanese font is only needed for the rirekisho; cache it on first use instead of shipping it to everyone.
        globIgnores: ['**/fonts/noto-sans-jp-*'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/fonts/'),
            handler: 'CacheFirst',
            options: { cacheName: 'jp-fonts', expiration: { maxEntries: 4 } },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2500,
  },
});
