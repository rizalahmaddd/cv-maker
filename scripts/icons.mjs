import { execFileSync } from 'node:child_process';

const sizes = [['pwa-192.png', 192], ['pwa-512.png', 512], ['apple-touch-icon.png', 180]];
for (const [name, size] of sizes) {
  execFileSync('magick', ['-background', 'none', '-density', '384', 'public/favicon.svg', '-resize', `${size}x${size}`, `public/${name}`]);
  console.log('wrote', name);
}
