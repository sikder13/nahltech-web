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

  return { title: t.pages.dpa.title };
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
      title={t.pages.dpa.title}
      lastUpdatedLabel={t.legalPage.lastUpdatedLabel}
      lastUpdated={t.legalPage.lastUpdated}
    >
      <p>{t.legalPage.body}</p>
    </LegalTemplate>
  );
}
