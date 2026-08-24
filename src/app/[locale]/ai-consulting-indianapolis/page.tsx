import { LocalLandingTemplate } from "@/components/templates/LocalLandingTemplate";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { routes } from "@/lib/routes";
import {
  breadcrumbSchema,
  dictionaryFaqSchema,
  localServiceSchema,
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
    alternates: { canonical: routes.aiConsultingIndianapolis },
    title: { absolute: t.pages.aiConsultingIndianapolis.metaTitle },
    description: t.pages.aiConsultingIndianapolis.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  const content = t.aiConsultingIndianapolis;
  const breadcrumb = breadcrumbSchema(t, routes.aiConsultingIndianapolis);
  const faq = dictionaryFaqSchema(content.faq.items);

  return (
    <>
      <JsonLd data={localServiceSchema(t)} />
      {faq ? <JsonLd data={faq} /> : null}
      {breadcrumb ? <JsonLd data={breadcrumb} /> : null}
      <LocalLandingTemplate t={t} content={content} />
    </>
  );
}
