import { DemoProse } from "@/components/blocks/demos";
import { ServiceProseSection } from "@/components/blocks/service-blocks";
import { ServiceTemplate } from "@/components/templates/ServiceTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes, softwarePageLinkPaths } from "@/lib/routes";
import {
  breadcrumbSchema,
  dictionaryFaqSchema,
  serviceSchema,
} from "@/lib/schema-org";

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
    alternates: { canonical: routes.softwareDevelopment },
    title: { absolute: t.pages.softwareDevelopment.metaTitle },
    description: t.pages.softwareDevelopment.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const content = t.servicePages.softwareDevelopment;
  const breadcrumb = breadcrumbSchema(t, routes.softwareDevelopment);
  // Built from the same entries the accordion renders, so the markup and the
  // visible answers cannot drift apart.
  const faq = dictionaryFaqSchema(content.faq);

  return (
    <>
      <JsonLd data={serviceSchema(t, "softwareDevelopment")} />
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      {faq ? <JsonLd data={faq} /> : null}
      <ServiceTemplate
        t={t}
        serviceKey="softwareDevelopment"
        content={content}
        afterProblem={
          <>
            <ServiceProseSection
              heading={content.proof.heading}
              body={content.proof.body}
              hrefs={softwarePageLinkPaths}
              tinted
            />
            <ServiceProseSection
              heading={content.builds.heading}
              items={content.builds.items}
            />
            <ServiceProseSection
              heading={content.cost.heading}
              body={content.cost.body}
              hrefs={softwarePageLinkPaths}
            />
          </>
        }
        demo={
          <DemoProse heading={content.demo.heading} body={content.demo.body} />
        }
      />
    </>
  );
}
