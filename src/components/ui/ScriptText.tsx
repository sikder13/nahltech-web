import type { ReactNode } from "react";

/**
 * Marks non-Latin runs inside otherwise-English copy with their own `lang`.
 *
 * The about page names Hafsa Sastho in Bengali — হাফসা স্বাস্থ্য — inside an
 * English sentence. Two things go wrong if that is left as bare text in an
 * `en` document.
 *
 * A screen reader pronounces it with English phonetics, which produces noise
 * rather than a name. `lang` on the run is what tells it to switch voices,
 * and it is the same rule that puts `lang`/`dir` on the html element for the
 * ar and bn locales (ARCH-1 §8) — applied to a phrase instead of a page.
 *
 * And Inter is subsetted to latin, so the browser has to fall back for these
 * glyphs anyway. Tagging the run lets it choose a Bengali face deliberately
 * rather than by accident; `:lang(bn)` in globals.css names the ones the
 * common platforms ship. Shipping a Bengali webfont for two words would cost
 * more than the problem is worth.
 *
 * Detection is by Unicode block, not by a list of phrases, so this keeps
 * working when the copy changes. Latin text is returned untouched and
 * unwrapped — a document full of pointless spans helps nobody.
 */

/**
 * One run of Bengali, from its first character to its last.
 *
 * Interior spaces and the zero-width joiners Bengali conjuncts use are part
 * of the run; the trailing boundary is a Bengali character, so a space before
 * the next English word stays outside the span.
 */
const BENGALI_RUN = /([ঀ-৿](?:[ঀ-৿\s‌‍]*[ঀ-৿])?)/g;

export function markScriptRuns(text: string): ReactNode {
  if (!BENGALI_RUN.test(text)) return text;
  // `test` on a global regex leaves lastIndex behind it.
  BENGALI_RUN.lastIndex = 0;

  // Split on a capturing group: even indices are the surrounding text, odd
  // indices are the runs themselves.
  return text.split(BENGALI_RUN).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} lang="bn">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
