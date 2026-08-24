import Link from "next/link";

import { DemoCasePanel } from "@/components/blocks/demos";
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
    alternates: { canonical: routes.aiConsultancy },
    title: { absolute: t.pages.aiConsultancy.metaTitle },
    description: t.pages.aiConsultancy.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const breadcrumb = breadcrumbSchema(t, routes.aiConsultancy);

  return (
    <>
      <JsonLd data={serviceSchema(t, "aiConsultancy")} />
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <ServiceTemplate
        t={t}
        serviceKey="aiConsultancy"
        content={t.servicePages.aiConsultancy}
        demo={
          <DemoCasePanel
            heading={t.servicePages.aiConsultancy.demo.heading}
            rows={t.servicePages.aiConsultancy.demo.rows}
            closing={t.servicePages.aiConsultancy.demo.closing}
          />
        }
        /* The one addition to this page: a route to the Indianapolis landing
           page for the reader who came here with local intent. Sits after the
           measurement block, where the page has finished making its case and
           the next question is whether we work near them. Nothing else on
           this page changes. */
        aside={
          <div className="mx-auto max-w-(--container-page) px-sm">
            <p className="max-w-prose text-text-muted">
              {t.aiConsultingIndianapolis.inboundLinks.aiConsultancy}{" "}
              <Link
                href={routes.aiConsultingIndianapolis}
                className="link-accent underline decoration-accent decoration-2"
              >
                {t.aiConsultingIndianapolis.anchor}
              </Link>
              .
            </p>
          </div>
        }
      />
    </>
  );
}
