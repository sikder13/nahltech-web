import { DemoProse } from "@/components/blocks/demos";
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

  return { title: { absolute: t.pages.softwareDevelopment.metaTitle } };
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
      content={t.servicePages.softwareDevelopment}
      demo={
        <DemoProse
          heading={t.servicePages.softwareDevelopment.demo.heading}
          body={t.servicePages.softwareDevelopment.demo.body}
        />
      }
    />
  );
}
