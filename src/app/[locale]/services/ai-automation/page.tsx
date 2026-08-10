import { DemoCalculation } from "@/components/blocks/demos";
import { ServiceTemplate } from "@/components/templates/ServiceTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return { title: { absolute: t.pages.aiAutomation.metaTitle } };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return (
    <ServiceTemplate
      t={t}
      content={t.servicePages.aiAutomation}
      demo={
        <DemoCalculation
          heading={t.servicePages.aiAutomation.demo.heading}
          lead={t.servicePages.aiAutomation.demo.lead}
          rows={t.servicePages.aiAutomation.demo.rows}
          total={t.servicePages.aiAutomation.demo.total}
          note={t.servicePages.aiAutomation.demo.note}
          closing={t.servicePages.aiAutomation.demo.closing}
        />
      }
    />
  );
}
