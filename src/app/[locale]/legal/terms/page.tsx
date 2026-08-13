import { LegalSections } from "@/components/blocks/LegalSections";
import { LegalTemplate } from "@/components/templates/LegalTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return { title: t.pages.terms.title, description: t.pages.terms.description };
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
      title={t.pages.terms.title}
      lastUpdatedLabel={t.legalPage.lastUpdatedLabel}
      lastUpdated={t.legalPage.lastUpdated}
    >
      <p>{t.legalPage.terms.intro}</p>
      <LegalSections sections={t.legalPage.terms.sections} />
    </LegalTemplate>
  );
}
