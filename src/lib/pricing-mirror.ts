import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * The Indianapolis page's pricing table, mirrored from /pricing.
 *
 * The draft this page was written from carried its own dollar figures, and
 * four of them contradicted the published rate card. A landing page that
 * quotes a different audit fee than /pricing is worse than a landing page
 * with no table: the visitor who checks both has caught us in a
 * contradiction, and the one who doesn't has been quoted a number we will
 * not honour.
 *
 * So the figures are not written here at all. Every price and every note is
 * read out of `t.pricing` — the same object /pricing renders — which makes
 * drift impossible rather than merely unlikely. Editing the rate card edits
 * this table in the same commit, and the JSON-LD offers with it, because
 * `schema-org.ts` builds them from this same list.
 *
 * Two cells are the page's own approved copy rather than a mirror: the free
 * scan row, which /pricing describes at greater length under a different
 * name, and the audit's "what you get", which the draft words for a local
 * reader. Neither states a price.
 */

export type PricingRow = {
  engagement: string;
  price: string;
  detail: string;
  /**
   * The string the Offer's price is parsed out of, which is not always the
   * string the cell shows. The scan cell reads "Free, 30 minutes" — true, and
   * unparseable — so the Offer reads the rate card's "$0" instead. Free is a
   * published price, and the two say the same thing.
   */
  offerAmount: string;
};

/** The rate-card rows this table mirrors, in the order it shows them. */
const MIRRORED_PROJECTS = [
  "AI Automation build",
  "Web Development",
  "Software Development",
] as const;

/** The audit tier, by the name the rate card gives it. */
const AUDIT_TIER = "AI Opportunity Audit";

/** The free scan tier, whose published figure the scan row's Offer carries. */
const SCAN_TIER = "Free AI Opportunity Scan";

/**
 * Throws rather than falling back. A renamed rate-card row must fail the
 * build, not silently drop a row out of the table and an offer out of the
 * markup — the failure mode this module exists to prevent is the quiet one.
 */
function byName<T extends { name: string }>(
  rows: readonly T[],
  name: string,
  kind: string,
): T {
  const found = rows.find((row) => row.name === name);
  if (!found) {
    throw new Error(
      `pricing-mirror: no ${kind} named "${name}" in the rate card. ` +
        `Renaming a row on /pricing means updating MIRRORED_PROJECTS.`,
    );
  }
  return found;
}

export function localPricingRows(t: Dictionary): PricingRow[] {
  const page = t.aiConsultingIndianapolis.pricing;
  const scanTier = byName(t.pricing.tiers, SCAN_TIER, "tier");
  const audit = byName(t.pricing.tiers, AUDIT_TIER, "tier");

  return [
    { ...page.scanRow, offerAmount: scanTier.price },
    {
      engagement: audit.name,
      // "$2,500" + "fully credited" — the rate card's own two halves, joined
      // rather than restated, so the credit terms cannot drift from it.
      price: `${audit.price}, ${audit.unit}`,
      detail: page.auditDetail,
      offerAmount: audit.price,
    },
    ...MIRRORED_PROJECTS.map((name) => {
      const project = byName(t.pricing.projects, name, "project");
      return {
        engagement: project.name,
        price: project.price,
        detail: project.note,
        offerAmount: project.price,
      };
    }),
  ];
}
