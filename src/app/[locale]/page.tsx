import { HomeTemplate } from "@/components/templates/HomeTemplate";
import { getResearchForHub } from "@/lib/research";
import { routes } from "@/lib/routes";
import { requireDictionary } from "@/lib/i18n/require-dictionary";
import { localBusinessSchema } from "@/lib/schema-org";

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
    alternates: { canonical: routes.home },
    title: { absolute: t.pages.home.metaTitle },
    description: t.pages.home.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  // The hub's first entry is the methodology — the spine of the section and
  // the document the engagements all point at.
  const [featured] = getResearchForHub();

  return (
    <>
      <JsonLd data={localBusinessSchema(t)} />
      <HomeTemplate
        t={t}
        featured={
          featured
            ? {
                title: featured.title,
                description: featured.description,
                href: `${routes.research}/${featured.slug}`,
              }
            : undefined
        }
      />
    </>
  );
}
