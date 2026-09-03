import Link from "next/link";

import { marketDictionaryKeys, marketRouteKeys, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * The one sentence that links all four market pages.
 *
 * It exists once and renders in three places — the home page, the /about
 * services band, and the Indianapolis landing page — because it is *one*
 * approved sentence, not three. The founder supplied it verbatim for the
 * Indianapolis page; the home and /about placements re-use those exact
 * characters rather than each getting a lead-in written for it, which is
 * both the rule-12-safe option and the one that keeps a single voice.
 *
 * Only the punctuation between the anchors is code. Everything a visitor
 * reads — the lead-in and the four anchor texts — comes from the dictionary,
 * and `markets.test.ts` pins the assembled sentence character for character
 * so this cannot quietly start reading differently from what was approved.
 *
 * The link classes duplicate what `Prose` applies to any `<a>` inside it, so
 * this renders identically whether it sits in a Prose column (/about) or on
 * bare page ground (home, Indianapolis).
 */
export function MarketsLine({
  t,
  className,
}: {
  t: Dictionary;
  className?: string;
}) {
  const markets = marketRouteKeys.map((key) => ({
    anchor: t.markets[marketDictionaryKeys[key]].anchor,
    href: routes[key],
  }));

  return (
    <p className={className}>
      {t.markets.sentencePrefix}{" "}
      {markets.map((market, index) => (
        <span key={market.href}>
          <Link
            href={market.href}
            className="link-accent underline decoration-accent decoration-2"
          >
            {market.anchor}
          </Link>
          {/* Oxford comma before the last of three or more, "and" alone for
              two, nothing for one — the sentence has to read as a sentence
              however many markets there are. */}
          {index < markets.length - 2
            ? ", "
            : index === markets.length - 2
              ? markets.length > 2
                ? ", and "
                : " and "
              : "."}
        </span>
      ))}
    </p>
  );
}
