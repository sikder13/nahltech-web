import { CardGrid, ServiceCard } from "@/components/blocks/cards";
import { FadeIn } from "@/components/ui/FadeIn";

import type { IconName } from "@/components/ui/Icon";

export type ServiceEntry = {
  title: string;
  description: string;
  href: string;
  icon: IconName;
};

export function ServicesGrid({
  heading,
  services,
}: {
  heading: string;
  services: readonly ServiceEntry[];
}) {
  return (
    <section
      aria-labelledby="services-heading"
      className="mx-auto max-w-(--container-page) px-sm py-2xl"
    >
      <FadeIn>
        <h2
          id="services-heading"
          className="max-w-prose text-2xl font-bold tracking-tight text-balance text-text"
        >
          {heading}
        </h2>
        <span className="mt-xs heading-rule" aria-hidden="true" />

        <div className="mt-lg">
          <CardGrid columns={4}>
            {services.map((service) => (
              <ServiceCard key={service.href} {...service} />
            ))}
          </CardGrid>
        </div>
      </FadeIn>
    </section>
  );
}
