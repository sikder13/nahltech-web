import Link from "next/link";
import { notFound } from "next/navigation";

import { PreviousVersions, SheetCard } from "@/components/sheets/SheetCard";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { allAuditPages, auditPageByToken } from "@/lib/letter-pages/registry";
import { sheetById } from "@/lib/sheets";

import type { Metadata } from "next";

/**
 * A provider's reference sheets, at an address that outlives the letter.
 *
 * The printed sheets carry `nahltech.com/<slug>/sheets` in their footers, so
 * this page has to be here on the day the letter lands and for as long as a
 * copy is pinned beside a billing screen. It is deliberately small: the two
 * cards, the date on each, and older issues once there are any. No visit is
 * counted and nothing is asked for.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return allAuditPages().map((page) => ({ token: page.token }));
}

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const config = auditPageByToken(token);
  if (!config) return {};
  return {
    title: config.sheetsPage.heading,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function Page({ params }: Params) {
  const { token } = await params;
  const config = auditPageByToken(token);
  if (!config) notFound();
  const t = await requireDictionary("en");
  const cards = config.sheets.cards.flatMap((card) => {
    const sheet = sheetById(card.sheet);
    return sheet ? [{ ...card, sheet }] : [];
  });

  return (
    <main className="mx-auto min-h-screen max-w-[52rem] bg-[#faf8f4] px-sm pt-lg pb-2xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2xs text-sm font-semibold text-text link-accent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- same fixed mark
          and the same measured reasoning as the site header. */}
        <img
          src="/images/logo-hex.webp"
          alt=""
          width={179}
          height={192}
          className="h-6 w-auto"
        />
        {config.firm}
      </Link>
      <h1 className="mt-xl font-display text-[2rem] leading-[1.12] font-semibold text-balance text-text lg:text-[2.75rem]">
        {config.sheetsPage.heading}
      </h1>
      <ul className="mt-lg grid gap-sm sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.sheet.id}>
            <SheetCard
              sheet={card.sheet}
              title={card.title}
              line={card.line}
              download={config.sheets.download}
              level={2}
            />
          </li>
        ))}
      </ul>
      <p className="mt-md max-w-[38rem] text-base text-text-muted">
        {config.sheetsPage.line}
      </p>
      <PreviousVersions
        sheets={cards.map((card) => card.sheet)}
        heading={t.sheets.previousVersions}
      />
    </main>
  );
}
