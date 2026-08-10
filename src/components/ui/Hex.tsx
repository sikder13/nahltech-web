import type { ReactNode } from "react";

/**
 * Hexagonal geometry.
 *
 * "Nahl" is Arabic for honeybee, so the hive is the one visual territory the
 * company owns by name. The motif is structural, never wallpaper: it appears
 * in exactly six places across the site (hero gesture, proof-bar icons,
 * method cells, team avatars, image slots, and the monogram) and nowhere
 * else. No tiled backgrounds, no hexagons behind running text.
 *
 * Every hexagon here is decorative and `aria-hidden`. Gold sits at 1.59:1 on
 * white, well under the 3:1 floor for meaningful non-text, so a hexagon can
 * never be the only thing carrying information.
 */

/** Pointy-top hexagon, as a clip-path polygon. Used for avatar frames. */
export const HEX_CLIP =
  "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)";

/** Flat-top hexagon path on a 0 0 100 100 viewBox. Tessellates in a row. */
const FLAT_TOP = "M25 6.7 L75 6.7 L100 50 L75 93.3 L25 93.3 L0 50 Z";

/** Pointy-top hexagon path on a 0 0 100 100 viewBox. */
const POINTY_TOP = "M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z";

export function HexOutline({
  className = "",
  strokeWidth = 4,
  orientation = "pointy",
}: {
  className?: string;
  strokeWidth?: number;
  orientation?: "pointy" | "flat";
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
    >
      <path
        d={orientation === "flat" ? FLAT_TOP : POINTY_TOP}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Icon holder: a hexagon outline with the icon centred inside it. Replaces
 * the rounded card that used to wrap proof-bar items.
 */
export function HexFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex size-10 shrink-0 items-center justify-center ${className}`}
    >
      <HexOutline
        className="absolute inset-0 size-full text-border"
        strokeWidth={1}
      />
      <span className="relative flex items-center justify-center">
        {children}
      </span>
    </span>
  );
}

/**
 * The hero gesture: an offset cluster of gold hexagon outlines.
 *
 * Fixed intrinsic size and `aspect-square` so it reserves its box before
 * paint — no layout shift, which keeps the CLS budget at 0.05 intact.
 */
export function HexCluster({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative aspect-square w-full ${className}`}
    >
      <HexOutline
        className="absolute top-0 left-[18%] h-[46%] w-[52%] text-accent"
        strokeWidth={1.5}
      />
      <HexOutline
        className="absolute top-[27%] left-0 h-[46%] w-[52%] text-accent"
        strokeWidth={1.5}
      />
      <HexOutline
        className="absolute top-[27%] right-0 h-[46%] w-[52%] text-accent"
        strokeWidth={1.5}
      />
      <HexOutline
        className="absolute bottom-0 left-[18%] h-[46%] w-[52%] text-divider"
        strokeWidth={1.5}
      />
    </div>
  );
}
