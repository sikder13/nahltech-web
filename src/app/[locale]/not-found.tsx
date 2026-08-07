import { ButtonLink } from "@/components/ui/ButtonLink";
import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { routes } from "@/lib/routes";

/**
 * Styled 404, rendered inside the locale layout so it keeps the header and
 * footer. A not-found boundary cannot read route params, so it always renders
 * in the default locale — correct here, since `en` is the only live one.
 */
export default async function NotFound() {
  const t = await getDictionary(defaultLocale);

  return (
    <div className="mx-auto max-w-(--container-page) px-sm py-3xl">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2xs text-3xl font-bold tracking-tight text-text">
        {t.notFound.title}
      </h1>
      <p className="mt-sm text-text-muted">{t.notFound.body}</p>
      <ButtonLink href={routes.home} className="mt-lg">
        {t.notFound.homeCta}
      </ButtonLink>
    </div>
  );
}
