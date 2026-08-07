import { notFound } from "next/navigation";

/**
 * Catch-all for unknown paths under a locale.
 *
 * Without it an unmatched URL fails segment matching before the `[locale]`
 * layout is reached, and Next falls back to its unstyled built-in 404. This
 * lets the locale segment match so `not-found.tsx` renders inside the normal
 * header/footer shell. Static routes always win over a catch-all, so no real
 * page is shadowed.
 */
export default function UnmatchedPage(): never {
  notFound();
}
