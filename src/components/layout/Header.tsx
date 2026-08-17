import Link from "next/link";

import { MobileNav } from "@/components/layout/MobileNav";
import { NavDropdown } from "@/components/layout/NavDropdown";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  bookingCta,
  contactDetails,
  routes,
  serviceRouteKeys,
} from "@/lib/routes";

import type { Dictionary } from "@/lib/i18n/get-dictionary";

/**
 * Primary nav: Services, Products, Pricing, About, Contact.
 *
 * Research is deliberately not here. It was, and it came out when Contact went
 * in — the bar was crowding at laptop widths and Research is the one item
 * every visitor already reaches contextually: from the footer's Company
 * column, the home page's featured section, every service page, and the blog
 * posts that cite it. Contact had no such path. Removing Research is a
 * presentation change only; nothing about the routes, the sitemap or the
 * schema moves with it, which `crawl-check` and the sitemap test both hold.
 */
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
    <header className="sticky top-0 z-50 border-b border-divider">
      {/* The blur lives on its own layer rather than on the header.

          `backdrop-filter` makes an element the containing block for every
          `position: fixed` descendant, and the mobile menu panel is one:
          with the filter on the header, the panel's `top-16 bottom-0`
          resolved against a 64px-tall box and the whole menu rendered as a
          49px scrolling sliver. Measured at 390px — 49px with the filter,
          780px without.

          As a sibling of the content it blurs exactly the same pixels and
          contains nothing, so the panel resolves against the viewport again.
          Do not fold this back onto the header element. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-bg/95 backdrop-blur"
      />
      <div className="mx-auto flex h-16 max-w-(--container-page) items-center justify-between gap-md px-sm">
        <Link
          href={routes.home}
          aria-label={t.a11y.homeLink}
          className="group flex items-center gap-2xs text-base font-semibold tracking-tight text-text"
        >
          {/* The official mark. The lockup's wordmark is deliberately not
              used — the company name is live text on the next line, and
              setting it twice would ship a name that cannot reflow or be
              read. Height-constrained so the hexagon keeps its own ratio.

              A plain <img> rather than next/image: this is a fixed 24px mark
              on every page, already optimised to 5 kB at build time, and
              next/image's client runtime costs ~5 kB gz of JavaScript site-
              wide to do work that is already done. Width and height are set,
              so it reserves its own space and contributes nothing to CLS. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- measured:
              next/image added 5.0 kB gz to every page and put first-load over
              the ARCH-1 §7 ceiling, to optimise an already-optimised 5 kB
              fixed-size mark. */}
          <img
            src="/images/logo-hex.webp"
            alt={t.site.name}
            width={179}
            height={192}
            className="h-6 w-auto"
          />
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
                href={routes.about}
                className="text-sm font-medium text-text link-accent"
              >
                {t.nav.about}
              </Link>
            </li>
            <li>
              <Link
                href={routes.contact}
                className="text-sm font-medium text-text link-accent"
              >
                {t.nav.contact}
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
          <ButtonLink href={bookingCta.href} external={bookingCta.external}>
            {t.cta.bookCall}
          </ButtonLink>
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
            { href: routes.about, label: t.nav.about },
            { href: routes.contact, label: t.nav.contact },
          ]}
          phoneHref={contactDetails.phoneHref}
          booking={bookingCta}
        />
      </div>
    </header>
  );
}
