import Link from "next/link";

import { FadeIn } from "@/components/ui/FadeIn";
import { HexFrame } from "@/components/ui/Hex";
import { Icon, type IconName } from "@/components/ui/Icon";

export type ProofItem = {
  icon: IconName;
  label: string;
  href: string;
  external?: boolean;
};

/**
 * Verifiable proof, not social proof.
 *
 * Every slot points at something a visitor can go and check for themselves —
 * a running product, a shipped app, published research, an open method.
 * Deliberately no logo wall, no "trusted by", no counters: none of those can
 * be verified from the page, and unverifiable claims are exactly what this
 * site is positioned against.
 */
export function ProofBar({
  heading,
  items,
}: {
  heading: string;
  items: readonly ProofItem[];
}) {
  return (
    <section
      aria-labelledby="proof-heading"
      className="border-y border-divider bg-surface"
    >
      <div className="mx-auto max-w-(--container-page) px-sm py-xl">
        <FadeIn>
          <h2 id="proof-heading" className="text-sm font-semibold text-text">
            {heading}
          </h2>
          <ul className="mt-md grid sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <li
                key={`${item.href}-${item.label}`}
                className="flex gap-sm border-divider py-sm sm:py-0 lg:border-s lg:ps-md lg:first:border-s-0 lg:first:ps-0"
              >
                <HexFrame className="mt-px text-text">
                  <Icon name={item.icon} className="size-4" />
                </HexFrame>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text link-accent"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="text-sm text-text link-accent"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}
