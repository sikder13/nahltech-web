import Link from "next/link";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { contactDetails, routes } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function Header({ t }: { t: Dictionary }) {
  const serviceItems = [
    { href: routes.services, label: t.nav.services },
    { href: routes.aiSearchVisibility, label: t.services.aiSearchVisibility },
    { href: routes.localSeo, label: t.services.localSeo },
    { href: routes.webDevelopment, label: t.services.webDevelopment },
    { href: routes.aiAutomation, label: t.services.aiAutomation },
  ];

  const productItems = [
    { href: routes.products, label: t.nav.products },
    { href: routes.crawlmouse, label: t.products.crawlmouse },
    { href: routes.hafsaSastho, label: t.products.hafsaSastho },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center justify-between gap-md px-sm">
        <Link
          href={routes.home}
          aria-label={t.a11y.homeLink}
          className="text-base font-bold tracking-tight text-accent"
        >
          {/* [PLACEHOLDER: logo mark — wordmark stands in until the asset is supplied] */}
          {t.site.name}
        </Link>

        <nav
          aria-label={t.a11y.primaryNavigation}
          className="hidden md:block"
          data-testid="primary-nav"
        >
          <ul className="flex items-center gap-md">
            <li>
              <NavDropdown label={t.nav.services} items={serviceItems} />
            </li>
            <li>
              <NavDropdown label={t.nav.products} items={productItems} />
            </li>
            <li>
              <Link
                href={routes.pricing}
                className="text-sm font-medium text-text hover:text-accent"
              >
                {t.nav.pricing}
              </Link>
            </li>
            <li>
              <Link
                href={routes.research}
                className="text-sm font-medium text-text hover:text-accent"
              >
                {t.nav.research}
              </Link>
            </li>
            <li>
              <Link
                href={routes.about}
                className="text-sm font-medium text-text hover:text-accent"
              >
                {t.nav.about}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="hidden items-center gap-sm md:flex">
          <a
            href={contactDetails.phoneHref}
            className="text-sm font-medium text-text-muted hover:text-accent"
          >
            {t.cta.phoneDisplay}
          </a>
          <ButtonLink href={routes.contact}>{t.cta.bookCall}</ButtonLink>
        </div>

        <MobileNav t={t} />
      </div>
    </header>
  );
}
