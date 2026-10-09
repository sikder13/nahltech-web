import Link from "next/link";
import { notFound } from "next/navigation";

import { LetterVisitBeacon } from "@/components/letter/LetterVisitBeacon";
import { PrototypeFrame } from "@/components/letter/PrototypeFrame";
import { letterBookingUrl } from "@/lib/letter-pages/booking";
import {
  allAuditPages,
  auditBoardHtml,
  auditPageByToken,
} from "@/lib/letter-pages/registry";

import type { Metadata } from "next";

/**
 * The prototype at full width, for a phone or for a closer look.
 *
 * Reached from the audit page and from `/<slug>/preview`. Unlisted in the
 * same ways as the page it belongs to, and counted under the same token.
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
    title: config.preview.frameTitle,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function Page({ params }: Params) {
  const { token } = await params;
  const config = auditPageByToken(token);
  if (!config) notFound();

  return (
    <main className="mx-auto max-w-[76rem] bg-[#faf8f4] px-sm pt-lg pb-2xl">
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
      <h1 className="mt-lg font-display text-[2rem] leading-[1.12] font-semibold text-balance text-text lg:text-[2.75rem]">
        {config.preview.title}
      </h1>
      <div className="mt-md overflow-hidden rounded-xl border border-text bg-bg">
        <PrototypeFrame
          html={auditBoardHtml(config.slug)}
          title={config.preview.frameTitle}
        />
      </div>
      <p className="mt-lg">
        <a
          href={letterBookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center rounded-md bg-cta px-lg text-lg font-semibold text-on-cta hover:bg-cta-hover sm:w-auto"
        >
          {config.book}
        </a>
      </p>
      <p className="mt-sm text-base text-text-muted">{config.safety}</p>
      <LetterVisitBeacon token={config.token} />
    </main>
  );
}
