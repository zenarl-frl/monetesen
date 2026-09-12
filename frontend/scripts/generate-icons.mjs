import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Keep all essential artwork local so the installed application works offline.
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#191919"/><path d="M128 344V206a36 36 0 0 1 72 0v74-110a36 36 0 0 1 72 0v110-74a36 36 0 0 1 72 0v138" fill="none" stroke="#FF4D4D" stroke-width="40" stroke-linecap="round"/><circle cx="394" cy="344" r="20" fill="#EBE9E1"/></svg>`);
for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180], ['maskable-512.png', 512]]) {
  await sharp(svg).resize(size, size).png().toFile(fileURLToPath(new URL(`../public/icons/${file}`, import.meta.url)));
  console.log(`Generated ${file} (${size}×${size})`);
}
