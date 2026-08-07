import { PageStub } from "@/components/blocks/PageStub";
import { requireDictionary } from "@/lib/i18n/require-dictionary";

import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return { title: { absolute: t.pages.home.title } };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return (
    <PageStub
      title={t.pages.home.title}
      placeholder={t.common.contentPlaceholder}
    />
  );
}
