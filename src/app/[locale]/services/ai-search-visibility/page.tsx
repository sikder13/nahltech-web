import { DemoInstructionCard } from "@/components/blocks/demos";
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

  return { title: { absolute: t.pages.aiSearchVisibility.metaTitle } };
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
      content={t.servicePages.aiSearchVisibility}
      demo={
        <DemoInstructionCard
          heading={t.servicePages.aiSearchVisibility.demo.heading}
          chip={t.servicePages.aiSearchVisibility.demo.chip}
          steps={t.servicePages.aiSearchVisibility.demo.steps}
          closing={t.servicePages.aiSearchVisibility.demo.closing}
        />
      }
    />
  );
}
