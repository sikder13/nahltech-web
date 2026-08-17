import { Fraunces, Inter } from "next/font/google";
import { notFound } from "next/navigation";

import { GoogleAnalytics } from "@next/third-parties/google";

import { OutboundEvents } from "@/components/analytics/OutboundEvents";
import { ChatWidget } from "@/components/conversion/ChatWidget";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { getDirection, isLiveLocale, liveLocales } from "@/lib/i18n/config";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { siteUrl } from "@/lib/routes";
import { organizationSchema, webSiteSchema } from "@/lib/schema-org";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/globals.css";

/**
 * Inter is the brand typeface. Self-hosted at build time by next/font — the
 * files are served from our own origin, so the page makes no request to a
 * third-party font host.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Display face, h1/h2 only. Two weights, latin subset — the whole family is
 * one file under the font budget in ARCH-1 §7.
 */
/** Unset in development and in any preview without the var — see the mount. */
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  variable: "--font-fraunces",
});

/**
 * Only live locales are prerendered. `ar` and `bn` are deliberately absent:
 * with `dynamicParams` at its default they fall through to a request-time
 * render, hit the guard below, and 404 — without the build emitting static
 * 404 shells for locales that have no content.
 */
export function generateStaticParams() {
  return liveLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLiveLocale(locale)) return {};

  const t = await requireDictionary(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t.site.name,
      template: `%s | ${t.site.name}`,
    },
    // No site-wide description fallback on purpose. A page either has an
    // approved description or emits none — shipping a [PLACEHOLDER] string
    // into <meta name="description"> would put it in search results, which
    // is strictly worse than letting the engine generate a snippet.
  };
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

  const t = await requireDictionary(locale);

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Framer Motion server-renders `opacity: 0` on entrance-animated
            sections. Without scripting they would never animate in, so the
            page would look empty. This restores them for no-JS visitors. */}
        <noscript>
          <style>{`[data-fade]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {/* Site-wide identity. Every other node on the site references these
            two by @id rather than restating the company. */}
        <JsonLd data={organizationSchema(t)} />
        <JsonLd data={webSiteSchema(t)} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <MotionProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:start-sm focus:top-sm focus:z-50 focus:rounded-md focus:bg-cta focus:px-sm focus:py-2xs focus:text-on-cta"
          >
            {t.a11y.skipToContent}
          </a>
          <Header t={t} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer t={t} />
          {/* Only the strings it renders cross the RSC boundary, so the
              payload does not carry the whole dictionary to the client. */}
          <ChatWidget
            labels={{
              launcherLabel: t.chat.launcherLabel,
              closeLabel: t.chat.closeLabel,
              title: t.chat.title,
              placeholder: t.chat.placeholder,
              send: t.chat.send,
              conversationLabel: t.chat.conversationLabel,
              youLabel: t.chat.youLabel,
              assistantLabel: t.chat.assistantLabel,
              fallback: t.chat.fallback,
              consentPrompt: t.chat.consentPrompt,
              consentButton: t.chat.consentButton,
              consentSuccess: t.chat.consentSuccess,
              captureChip: t.chat.captureChip,
              captureChipDismiss: t.chat.captureChipDismiss,
              rateLimited: t.leadForm.rateLimited,
              networkError: t.leadForm.networkError,
              callLabel: t.cta.callLabel,
              bookCall: t.cta.bookCall,
            }}
            consentLabels={{
              name: t.leadForm.name,
              email: t.leadForm.email,
              phone: t.leadForm.phone,
              message: t.leadForm.message,
              submit: t.chat.consentButton,
              sending: t.leadForm.sending,
              rateLimited: t.leadForm.rateLimited,
              networkError: t.leadForm.networkError,
              errors: {
                nameRequired: t.leadForm.errors.nameRequired,
                emailRequired: t.leadForm.errors.emailRequired,
                emailInvalid: t.leadForm.errors.emailInvalid,
              },
            }}
          />
          <OutboundEvents />
        </MotionProvider>
        {/* Absent entirely when the measurement ID is not configured, so a
            local or preview build ships no analytics and no console noise.
            next/script's default strategy is afterInteractive, which is what
            ARCH-1 §7's budget assumes. */}
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
      </body>
    </html>
  );
}
