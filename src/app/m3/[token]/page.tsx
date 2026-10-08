import { notFound } from "next/navigation";

import { FooterBase } from "@/components/layout/FooterBase";
import { LetterPage } from "@/components/letter/LetterPage";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { letterBookingUrl } from "@/lib/letter-pages/booking";
import {
  allLetterPages,
  letterPageByToken,
  letterSharedCopy,
} from "@/lib/letter-pages/registry";

import type { Metadata } from "next";

/**
 * A letter page, at the address its letter prints.
 *
 * Unlisted by construction, the same way the dashboards are: built ahead
 * of time only for known tokens (`dynamicParams = false`, so any other
 * token is a plain 404), absent from the sitemap, `noindex` in the head and
 * in an `X-Robots-Tag` header from the middleware, and linked from nowhere
 * on the site.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return allLetterPages().map((page) => ({ token: page.token }));
}

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const config = letterPageByToken(token);
  if (!config) return {};
  return {
    title: config.tabTitle,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function Page({ params }: Params) {
  const { token } = await params;
  const config = letterPageByToken(token);
  if (!config) notFound();
  // The site footer, minus the newsletter form: this page asks for one thing.
  const t = await requireDictionary("en");

  return (
    <>
      <LetterPage
        config={config}
        shared={letterSharedCopy()}
        bookingUrl={letterBookingUrl}
      />
      {/* Room under the footer for the phone action bar, so it never covers
          the last line. */}
      <div className="pb-20 lg:pb-0">
        <FooterBase t={t} hideSocial={["github"]} />
      </div>
    </>
  );
}
