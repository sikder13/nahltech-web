import Link from "next/link";

import { LegalTemplate } from "@/components/templates/LegalTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes } from "@/lib/routes";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return { title: t.pages.dpa.title, description: t.pages.dpa.description };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);
  const { intro, paragraphs, privacyReference } = t.legalPage.dpa;

  return (
    <LegalTemplate
      title={t.pages.dpa.title}
      lastUpdatedLabel={t.legalPage.lastUpdatedLabel}
      lastUpdated={t.legalPage.lastUpdated}
    >
      <p>{intro}</p>
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p>
        {privacyReference.before}
        <Link href={routes.privacy}>{privacyReference.linkLabel}</Link>
        {privacyReference.after}
      </p>
    </LegalTemplate>
  );
}
