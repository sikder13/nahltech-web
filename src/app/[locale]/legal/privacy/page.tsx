import { LegalSections } from "@/components/blocks/LegalSections";
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

  return {
    alternates: { canonical: routes.privacy },
    title: t.pages.privacy.title,
    description: t.pages.privacy.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return (
    <LegalTemplate
      title={t.pages.privacy.title}
      lastUpdatedLabel={t.legalPage.lastUpdatedLabel}
      lastUpdated={t.legalPage.lastUpdated}
    >
      <p>{t.legalPage.privacy.intro}</p>
      <LegalSections sections={t.legalPage.privacy.sections} />
    </LegalTemplate>
  );
}
