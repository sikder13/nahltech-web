import { CardGrid, ServiceCard } from "@/components/blocks/cards";
import { FadeIn } from "@/components/ui/FadeIn";

import type { IconName } from "@/components/ui/Icon";
import type { ReactNode } from "react";

export type ServiceEntry = {
  title: string;
  description: string;
  href: string;
  icon: IconName;
};

export function ServicesGrid({
  heading,
  services,
  footer,
}: {
  heading: string;
  services: readonly ServiceEntry[];
  /**
   * A line under the grid, inside the same FadeIn so it arrives with the
   * cards rather than after them. The home page puts the markets sentence
   * here; absent, the section renders exactly as it did before.
   */
  footer?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="services-heading"
      className="mx-auto max-w-(--container-page) px-sm py-2xl"
    >
      <FadeIn>
        <h2
          id="services-heading"
          className="max-w-prose text-section text-balance text-text"
        >
          {heading}
        </h2>
        <span className="mt-xs heading-rule" aria-hidden="true" />

        <div className="mt-lg">
          <CardGrid columns={3}>
            {services.map((service, index) => (
              <ServiceCard
                key={service.href}
                {...service}
                delay={index * 0.06}
              />
            ))}
          </CardGrid>
        </div>
        {footer}
      </FadeIn>
    </section>
  );
}
