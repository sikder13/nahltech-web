/**
 * Derives the /about team avatars from the founders' own photographs.
 *
 *   node scripts/build-team-avatars.mjs
 *
 * The sources are personal photographs and are NOT in the repo — hard rule 2
 * keeps raw images out, and these are people's faces besides. They live in
 * `.work/team-source/`, which is gitignored. Only the derived WebP files are
 * committed, and they are small, square and deterministic.
 *
 * The crops are hand-measured per photograph and recorded below, because the
 * two frames are nothing alike: one is already square with the subject high in
 * the frame, the other is a tall portrait. Face detection would be a
 * dependency and a source of surprise for two images that will not change.
 *
 * WHY THE CROPS SIT WHERE THEY DO. The avatar is clipped by `HEX_CLIP`, a
 * pointy-top hexagon. That geometry is full width only between 25% and 75% of
 * the height; above and below, it narrows to a point. So a face has to sit in
 * that middle band or the hexagon eats it. Each crop below is chosen to put
 * the head across the middle of the square, not to fill it.
 *
 * Nothing is retouched. No filter, no background replacement, no generated
 * pixels — a crop, a resize and a WebP encode.
 *
 * Outputs, all committed:
 *   public/images/team/udaay-sikder.webp        160x160
 *   public/images/team/udaay-sikder@2x.webp     320x320
 *   public/images/team/mohieminul-khan.webp     160x160
 *   public/images/team/mohieminul-khan@2x.webp  320x320
 */
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, ".work/team-source");
const OUT_DIR = path.join(ROOT, "public/images/team");

/** Rendered at 56–64 px; 160 is the 1x asset and 320 covers retina. */
const SIZES = [160, 320];
const QUALITY = 80;

const PEOPLE = [
  {
    slug: "udaay-sikder",
    source: "udaay-source.jpg",
    /**
     * 1536x1536. Sitting, camera slightly below eye level, head high in the
     * frame — the hair reaches within 77 px of the top edge, so there is no
     * headroom to give. A 900 px square taken from the top edge puts the head
     * across the middle of the crop instead of near its top, which is what the
     * hexagon needs; the alternative, a larger square, only pushes the face
     * further into the clipped triangle.
     */
    crop: { left: 286, top: 0, size: 900 },
  },
  {
    slug: "mohieminul-khan",
    source: "mohieminul-source.jpg",
    /**
     * 1152x2048, a tall phone portrait against a plain wall. The full width is
     * the widest square available, and the head already spans most of it, so
     * this is as loose as the frame allows without inventing wall — which
     * would be a fabricated pixel on a photograph of a real person.
     */
    crop: { left: 0, top: 0, size: 1152 },
  },
];

mkdirSync(OUT_DIR, { recursive: true });

const report = [];

for (const person of PEOPLE) {
  const input = path.join(SOURCE_DIR, person.source);
  const image = sharp(input).rotate(); // Honour EXIF orientation before cropping.
  const meta = await image.metadata();

  const { left, top, size } = person.crop;
  if (left + size > meta.width || top + size > meta.height) {
    throw new Error(
      `${person.slug}: crop ${size}px at (${left}, ${top}) does not fit ${meta.width}x${meta.height}`,
    );
  }

  for (const dimension of SIZES) {
    const suffix = dimension === SIZES[0] ? "" : "@2x";
    const out = path.join(OUT_DIR, `${person.slug}${suffix}.webp`);

    await sharp(input)
      .rotate()
      .extract({ left, top, width: size, height: size })
      .resize(dimension, dimension, { fit: "cover" })
      .webp({ quality: QUALITY })
      .toFile(out);

    report.push({
      file: path.relative(ROOT, out),
      dimension: `${dimension}x${dimension}`,
      kb: (statSync(out).size / 1024).toFixed(1),
    });
  }
}

console.table(report);
