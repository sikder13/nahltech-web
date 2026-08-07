import { notFound } from "next/navigation";

import { getDirection, isLiveLocale, liveLocales } from "@/lib/i18n/config";

import type { ReactNode } from "react";

import "@/styles/globals.css";

/**
 * Only live locales are prerendered. `ar` and `bn` are deliberately absent:
 * with `dynamicParams` at its default they fall through to a request-time
 * render, hit the guard below, and 404 — without the build emitting static
 * 404 shells for locales that have no content.
 */
export function generateStaticParams() {
  return liveLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLiveLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body>{children}</body>
    </html>
  );
}
