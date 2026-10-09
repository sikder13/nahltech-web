import { notFound } from "next/navigation";

import { FooterBase } from "@/components/layout/FooterBase";
import { AuditPage } from "@/components/letter/AuditPage";
import { LetterPage } from "@/components/letter/LetterPage";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { letterBookingUrl } from "@/lib/letter-pages/booking";
import {
  allAuditPages,
  allLetterPages,
  auditBoardHtml,
  auditPageByToken,
  letterPageByToken,
  letterSharedCopy,
} from "@/lib/letter-pages/registry";
import { sheetById } from "@/lib/sheets";

import type { Metadata } from "next";

/**
 * A letter page, at the address its letter prints.
 *
 * Two kinds share the route: the ten-section proposal and the audit page.
 * Both are unlisted by construction, the same way the dashboards are: built
 * ahead of time only for known tokens (`dynamicParams = false`, so any other
 * token is a plain 404), absent from the sitemap, `noindex` in the head and
 * in an `X-Robots-Tag` header from the middleware, and linked from nowhere
 * on the site.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return [...allLetterPages(), ...allAuditPages()].map((page) => ({
    token: page.token,
  }));
}

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const config = letterPageByToken(token) ?? auditPageByToken(token);
  if (!config) return {};
  return {
    title: config.tabTitle,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function Page({ params }: Params) {
  const { token } = await params;
  const proposal = letterPageByToken(token);
  const audit = proposal ? undefined : auditPageByToken(token);
  if (!proposal && !audit) notFound();
  // The site footer, minus the newsletter form: this page asks for one thing.
  const t = await requireDictionary("en");
  const shared = letterSharedCopy();

  return (
    <>
      {proposal ? (
        <LetterPage
          config={proposal}
          shared={shared}
          bookingUrl={letterBookingUrl}
        />
      ) : null}
      {audit ? (
        <AuditPage
          config={audit}
          shared={shared}
          sheets={audit.sheets.cards.map((card) => {
            const sheet = sheetById(card.sheet);
            if (!sheet) {
              throw new Error(
                `content/letter-audits/${audit.slug}.json names sheet "${card.sheet}", which is not in content/sheets.json`,
              );
            }
            return sheet;
          })}
          boardHtml={auditBoardHtml(audit.slug)}
          bookingUrl={letterBookingUrl}
        />
      ) : null}
      {/* Room under the footer for the phone action bar, so it never covers
          the last line. */}
      <div className="pb-20 lg:pb-0">
        <FooterBase t={t} hideSocial={["github"]} />
      </div>
    </>
  );
}
