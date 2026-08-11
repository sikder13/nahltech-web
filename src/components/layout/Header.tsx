import Link from "next/link";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { BeeMark } from "@/components/ui/BeeMark";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { contactDetails, routes, serviceRouteKeys } from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

export function Header({ t }: { t: Dictionary }) {
  const serviceItems = [
    { href: routes.services, label: t.nav.services },
    ...serviceRouteKeys.map((key) => ({
      href: routes[key],
      label: t.services[key],
    })),
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
          className="group flex items-center gap-2xs text-base font-semibold tracking-tight text-text"
        >
          <BeeMark className="size-6 text-text" />
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
                className="text-sm font-medium text-text link-accent"
              >
                {t.nav.pricing}
              </Link>
            </li>
            <li>
              <Link
                href={routes.research}
                className="text-sm font-medium text-text link-accent"
              >
                {t.nav.research}
              </Link>
            </li>
            <li>
              <Link
                href={routes.about}
                className="text-sm font-medium text-text link-accent"
              >
                {t.nav.about}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="hidden items-center gap-sm md:flex">
          <a
            href={contactDetails.phoneHref}
            className="text-sm font-medium text-text-muted link-accent hover:text-text"
          >
            {t.cta.phoneDisplay}
          </a>
          <ButtonLink href={routes.contact}>{t.cta.bookCall}</ButtonLink>
        </div>

        <MobileNav
          labels={{
            openMenu: t.a11y.openMenu,
            closeMenu: t.a11y.closeMenu,
            primaryNavigation: t.a11y.primaryNavigation,
            phoneDisplay: t.cta.phoneDisplay,
            bookCall: t.cta.bookCall,
          }}
          links={[
            { href: routes.services, label: t.nav.services },
            ...serviceRouteKeys.map((key) => ({
              href: routes[key],
              label: t.services[key],
            })),
            { href: routes.products, label: t.nav.products },
            { href: routes.crawlmouse, label: t.products.crawlmouse },
            { href: routes.hafsaSastho, label: t.products.hafsaSastho },
            { href: routes.pricing, label: t.nav.pricing },
            { href: routes.research, label: t.nav.research },
            { href: routes.about, label: t.nav.about },
          ]}
          phoneHref={contactDetails.phoneHref}
          contactHref={routes.contact}
        />
      </div>
    </header>
  );
}
