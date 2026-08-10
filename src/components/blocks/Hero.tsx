import { ButtonLink } from "@/components/ui/ButtonLink";
import { FadeIn } from "@/components/ui/FadeIn";

import type { CtaAction } from "./CtaBlock";

export function Hero({
  headline,
  subline,
  primary,
  secondary,
}: {
  headline: string;
  subline: string;
  primary: CtaAction;
  secondary: CtaAction;
}) {
  return (
    <section className="mx-auto max-w-(--container-page) px-sm pt-3xl pb-2xl">
      <FadeIn>
        <h1 className="max-w-(--container-measure) text-display text-balance text-text">
          {headline}
        </h1>
        <span className="mt-md heading-rule" aria-hidden="true" />
        <p className="mt-md max-w-prose text-lg text-text-muted">{subline}</p>

        <div className="mt-lg flex flex-wrap gap-sm">
          <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
          <ButtonLink href={secondary.href} variant="secondary">
            {secondary.label}
          </ButtonLink>
        </div>
      </FadeIn>
    </section>
  );
}
