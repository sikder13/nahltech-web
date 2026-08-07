import { PageStub } from "@/components/blocks/PageStub";
import { requireDictionary } from "@/lib/i18n/require-dictionary";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await requireDictionary(locale);

  return (
    <PageStub
      title={t.pages.privacy.title}
      placeholder={t.common.contentPlaceholder}
    />
  );
}
