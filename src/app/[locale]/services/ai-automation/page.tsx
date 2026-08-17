import { DemoCalculation } from "@/components/blocks/demos";
import { ServiceTemplate } from "@/components/templates/ServiceTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes } from "@/lib/routes";
import { breadcrumbSchema, serviceSchema } from "@/lib/schema-org";

import { JsonLd } from "@/components/seo/JsonLd";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return {
    alternates: { canonical: routes.aiAutomation },
    title: { absolute: t.pages.aiAutomation.metaTitle },
    description: t.pages.aiAutomation.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const breadcrumb = breadcrumbSchema(t, routes.aiAutomation);

  return (
    <>
      <JsonLd data={serviceSchema(t, "aiAutomation")} />
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <ServiceTemplate
        t={t}
        serviceKey="aiAutomation"
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
    </>
  );
}
