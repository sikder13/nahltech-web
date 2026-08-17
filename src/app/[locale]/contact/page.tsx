import { ContactTemplate } from "@/components/templates/UtilityTemplates";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { localBusinessSchema } from "@/lib/schema-org";

import { JsonLd } from "@/components/seo/JsonLd";

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
    alternates: { canonical: routes.contact },
    title: t.pages.contact.title,
    description: t.pages.contact.description,
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
    <>
      <JsonLd data={localBusinessSchema(t)} />
      <ContactTemplate t={t} />
    </>
  );
}
