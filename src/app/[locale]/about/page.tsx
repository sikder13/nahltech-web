import { AboutTemplate } from "@/components/templates/UtilityTemplates";
import { requireDictionary } from "@/lib/i18n/require-dictionary";

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
    alternates: { canonical: routes.about },
    title: { absolute: t.pages.about.metaTitle },
    description: t.pages.about.description,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return <AboutTemplate t={t} />;
}
