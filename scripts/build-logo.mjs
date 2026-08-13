/**
 * Derives the site's logo assets from the official artwork.
 *
 *   node scripts/build-logo.mjs
 *
 * The source file (`public/images/logo-source.png`) is the full lockup: the
 * hex mark above a "NAHL TECHNOLOGIES" wordmark. The site renders the company
 * name as live text beside the mark, so shipping the lockup would set the name
 * twice — once as pixels that cannot reflow, restyle or be read by a screen
 * reader. Only the mark is extracted.
 *
 * The split is found rather than hardcoded: the mark and the wordmark are
 * separated by a band of fully transparent rows, so the first contiguous block
 * of opaque rows is the mark. If the artwork is ever replaced, rerun this — it
 * adapts, and it fails loudly rather than silently cropping the wrong thing.
 *
 * Outputs (all committed; they are small and deterministic):
 *   public/images/logo-hex.webp        what the header renders
 *   public/images/logo-hex.png         the mark, trimmed to its own bounds
 *   public/images/logo-hex-square.png  192x192, centred, for icon generation
 *
 * The WebP exists so the header can use a plain <img>. `next/image` would be
 * the right call for content imagery, but its client runtime costs ~5 kB gz on
 * every page, and here it would spend that optimising a single fixed-size
 * 24px mark that is already 4 kB and never changes size. Pre-optimising it at
 * build time gets the same bytes on the wire for none of the JavaScript. The
 * exception is recorded in ARCH-1 §7.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public/images/logo-source.png");
const OUT_MARK = path.join(ROOT, "public/images/logo-hex.png");
const OUT_WEBP = path.join(ROOT, "public/images/logo-hex.webp");
const OUT_SQUARE = path.join(ROOT, "public/images/logo-hex-square.png");

/** A pixel counts as ink if it is opaque and not near-white. */
const ALPHA_FLOOR = 32;
const LUMA_CEILING = 200;

const { data, info } = await sharp(readFileSync(SOURCE))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H, channels: C } = info;

const rowHasInk = [];
for (let y = 0; y < H; y++) {
  let ink = 0;
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (data[i + 3] > ALPHA_FLOOR && luma < LUMA_CEILING) ink++;
  }
  rowHasInk.push(ink > 0);
}

/** Contiguous runs of inked rows, top to bottom. */
const bands = [];
let start = null;
for (let y = 0; y <= H; y++) {
  if (y < H && rowHasInk[y] && start === null) start = y;
  if ((y === H || !rowHasInk[y]) && start !== null) {
    bands.push([start, y - 1]);
    start = null;
  }
}

if (bands.length < 2) {
  throw new Error(
    `Expected at least two bands (mark, then wordmark); found ${bands.length}. ` +
      `Has the source artwork changed shape?`,
  );
}

const [top, bottom] = bands[0];
let left = W;
let right = -1;
for (let y = top; y <= bottom; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (data[i + 3] > ALPHA_FLOOR && luma < LUMA_CEILING) {
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
}

const region = {
  left,
  top,
  width: right - left + 1,
  height: bottom - top + 1,
};

// The mark is a hexagon: taller than it is wide, and nothing like a strip. A
// bad crop (catching the wordmark, or a sliver) fails here instead of shipping.
const ratio = region.width / region.height;
if (ratio < 0.7 || ratio > 1.3) {
  throw new Error(
    `Cropped region ${region.width}x${region.height} has aspect ${ratio.toFixed(2)}; ` +
      `expected roughly square. Detected bands: ${JSON.stringify(bands)}`,
  );
}

console.log(`source      ${W}x${H}`);
console.log(`bands       ${bands.map(([a, b]) => `${a}-${b}`).join(", ")}`);
console.log(
  `mark        ${region.width}x${region.height} at (${region.left}, ${region.top})`,
);

// No .trim() here: the region above is already the ink bounding box, and
// chaining trim after extract makes sharp re-measure against the original
// dimensions and fail with "bad extract area".
await sharp(SOURCE)
  .extract(region)
  .png({ compressionLevel: 9, palette: true })
  .toFile(OUT_MARK);

await sharp(SOURCE)
  .extract(region)
  .webp({ quality: 90, effort: 6 })
  .toFile(OUT_WEBP);

await sharp(SOURCE)
  .extract(region)
  .resize(192, 192, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9, palette: true })
  .toFile(OUT_SQUARE);

for (const file of [OUT_MARK, OUT_WEBP, OUT_SQUARE]) {
  const meta = await sharp(file).metadata();
  const bytes = readFileSync(file).length;
  console.log(
    `wrote       ${path.relative(ROOT, file)}  ${meta.width}x${meta.height}  ` +
      `${(bytes / 1024).toFixed(1)} kB  alpha=${meta.hasAlpha}`,
  );
}
