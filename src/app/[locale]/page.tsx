import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale);

  return (
    <main>
      <h1>{t.pages.home.title}</h1>
      <p>{t.common.contentPlaceholder}</p>
    </main>
  );
}
