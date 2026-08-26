// One-off generator for the Day 5 app icon — a simple on-brand SVG (dark
// green felt + one gold-bordered card with a spade) rasterized to every
// size app.json references. No external assets; run with:
//   node scripts/generate-icon.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(ASSETS, { recursive: true });

const FELT_DARK = '#0B3D2E';
const FELT_DARKER = '#082B20';
const FELT_LIGHT = '#146044';
const CREAM = '#F7EFDD';
const GOLD = '#D4A657';

// A heart-shaped lobe (point down) plus a small flared stem beneath it —
// the classic spade construction — centered on (0,0), sized for a 1024
// canvas. Verified by test-rendering in isolation before use here.
const SPADE_PATH = `
  M 0,-160 C -130,-270 -240,-190 -240,-90
  C -240,20 -130,70 0,200
  C 130,70 240,20 240,-90
  C 240,-190 130,-270 0,-160
  Z
  M 0,60 L -230,360 L 230,360 Z
`;

/** Background felt gradient, no motif — used alone for
 * android-icon-background.png and as the base layer under the card. */
function backgroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <defs>
      <radialGradient id="glow" cx="50%" cy="38%" r="65%">
        <stop offset="0" stop-color="${FELT_LIGHT}"/>
        <stop offset="1" stop-color="${FELT_DARK}"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#glow)"/>
  </svg>`;
}

/** The card + spade motif alone, transparent background, kept inside the
 * ~66% adaptive-icon safe zone (roughly the center 675px of 1024). */
function foregroundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g transform="translate(512 512) rotate(-6)">
      <rect x="-230" y="-320" width="460" height="640" rx="46"
            fill="${CREAM}" stroke="${GOLD}" stroke-width="16"/>
      <g transform="scale(0.62)">
        <path d="${SPADE_PATH}" fill="${FELT_DARK}"/>
      </g>
    </g>
  </svg>`;
}

/** Single-color silhouette for Android 13+ themed icons (the OS applies its
 * own tint) — just the spade, not the card outline, since a plain
 * rounded-rect reads as nothing in particular once flattened to one color. */
function monochromeSvg() {
  // The spade's own bounding box isn't centered on its local origin (the
  // stem extends further down than the lobes extend up) — shift up to
  // compensate so it sits centered in the canvas with no card to anchor it.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <g transform="translate(512 435) rotate(-6) scale(0.9)">
      <path d="${SPADE_PATH}" fill="#FFFFFF"/>
    </g>
  </svg>`;
}

/** Full icon: background + motif composited together (iOS/web icon,
 * favicon, splash all derive from this same combined artwork). */
function fullIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <defs>
      <radialGradient id="glow" cx="50%" cy="38%" r="65%">
        <stop offset="0" stop-color="${FELT_LIGHT}"/>
        <stop offset="1" stop-color="${FELT_DARK}"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#glow)"/>
    <g transform="translate(512 512) rotate(-6)">
      <rect x="-230" y="-320" width="460" height="640" rx="46"
            fill="${CREAM}" stroke="${GOLD}" stroke-width="16"/>
      <g transform="scale(0.62)">
        <path d="${SPADE_PATH}" fill="${FELT_DARK}"/>
      </g>
    </g>
  </svg>`;
}

async function render(svgString, size, outFile, opts = {}) {
  await sharp(Buffer.from(svgString), { density: 384 })
    .resize(size, size)
    .png(opts)
    .toFile(path.join(ASSETS, outFile));
  console.log(`wrote ${outFile} (${size}x${size})`);
}

await render(fullIconSvg(), 1024, 'icon.png');
await render(backgroundSvg(), 512, 'android-icon-background.png');
await render(foregroundSvg(), 512, 'android-icon-foreground.png');
await render(monochromeSvg(), 432, 'android-icon-monochrome.png');
await render(fullIconSvg(), 48, 'favicon.png');
await render(foregroundSvg(), 1024, 'splash-icon.png');

writeFileSync(path.join(ASSETS, '_icon_source.svg'), fullIconSvg());
console.log('also wrote _icon_source.svg for reference');
