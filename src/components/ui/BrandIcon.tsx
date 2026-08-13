import type { SocialKey } from "@/lib/routes";

/**
 * Brand marks for the social links.
 *
 * Separate from `Icon` on purpose: that set is stroked (`fill="none"`,
 * `stroke="currentColor"`), which is right for a drawn icon language but wrong
 * for a logo. Every one of these is a solid glyph, so stroking it would render
 * an outline of the shape rather than the shape.
 *
 * Hand-drawn paths rather than a package — the site ships no icon library, and
 * three logos do not justify starting one.
 *
 * Decorative, like the rest of the icon set: the link that wraps one carries
 * the accessible name, so these are `aria-hidden` and never the only signal.
 */
const paths: Record<SocialKey, string> = {
  // X: the two crossing strokes, as one filled glyph.
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  // LinkedIn: the rounded square with the "in" wordmark knocked out.
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z",
  // Facebook: the "f" in a filled circle.
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
};

export function BrandIcon({
  name,
  className = "size-5",
}: {
  name: SocialKey;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d={paths[name]} />
    </svg>
  );
}
