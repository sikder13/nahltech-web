import { ButtonLink } from "@/components/ui/ButtonLink";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

/**
 * `liveUrl` is optional on purpose: a product in closed beta has nothing to
 * link to, and a "Try it live" button pointing nowhere is worse than no
 * button. Pass null and it is omitted.
 */
export function ProductHero({
  name,
  tagline,
  status,
  liveUrl,
  liveLabel,
}: {
  name: string;
  tagline: string;
  status: string;
  liveUrl: string | null;
  liveLabel: string;
}) {
  return (
    <section className="mx-auto max-w-(--container-page) px-sm pt-3xl pb-2xl">
      <FadeIn>
        <p className="text-sm font-semibold text-text-muted">{status}</p>
        <h1 className="mt-2xs text-display text-balance text-text">{name}</h1>
        <span className="mt-md heading-rule" aria-hidden="true" />
        <p className="mt-md max-w-prose text-lg text-text-muted">{tagline}</p>

        {liveUrl ? (
          <ButtonLink href={liveUrl} external className="mt-lg">
            {liveLabel}
          </ButtonLink>
        ) : null}
      </FadeIn>
    </section>
  );
}

export type Feature = { title: string; body: string };

export function FeatureGrid({
  heading,
  features,
}: {
  heading: string;
  features: readonly Feature[];
}) {
  return (
    <section className="border-y border-divider bg-surface">
      <div className={shell}>
        <FadeIn>
          <SectionHeading>{heading}</SectionHeading>
          <ul className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <li key={feature.title}>
                <h3 className="text-base font-semibold text-text">
                  {feature.title}
                </h3>
                <p className="mt-2xs text-sm text-text-muted">{feature.body}</p>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}

export function AudienceBlock({
  heading,
  items,
}: {
  heading: string;
  items: readonly string[];
}) {
  return (
    <section className={shell}>
      <FadeIn>
        <SectionHeading>{heading}</SectionHeading>
        <ul className="mt-lg max-w-prose space-y-2xs">
          {items.map((item) => (
            <li key={item} className="flex gap-2xs text-text">
              <Icon name="check" className="mt-1 size-4 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </FadeIn>
    </section>
  );
}
