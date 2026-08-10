import { ButtonLink } from "@/components/ui/ButtonLink";
import { FadeIn } from "@/components/ui/FadeIn";
import { HexCluster } from "@/components/ui/Hex";

import type { CtaAction } from "./CtaBlock";

/**
 * Asymmetric split, not a centred stack.
 *
 * The headline takes roughly 58% on lg, with the gold hexagon cluster
 * anchoring the remaining 42%. Below lg the cluster drops out entirely rather
 * than stacking: at phone width it would either crowd the fold or shrink into
 * confetti, and the headline is the LCP element that matters. To stop the
 * mobile hero reading bare without it, the gold rule thickens and lengthens
 * there — the brand gesture stays present, just in the register that fits.
 */
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
    <section className="mx-auto max-w-(--container-page) px-sm pt-2xl pb-2xl lg:pt-3xl">
      <div className="grid items-center gap-xl lg:grid-cols-[58fr_42fr]">
        <FadeIn>
          <h1 className="text-display text-balance text-text">{headline}</h1>

          <span
            aria-hidden="true"
            className="mt-md block h-1 w-16 bg-accent lg:h-[3px] lg:w-12"
          />

          <p className="mt-md max-w-prose text-lg text-text-muted">{subline}</p>

          <div className="mt-lg flex flex-wrap gap-sm">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            <ButtonLink href={secondary.href} variant="secondary">
              {secondary.label}
            </ButtonLink>
          </div>
        </FadeIn>

        <div className="hidden lg:block">
          <FadeIn delay={0.12}>
            <HexCluster className="ms-auto max-w-[22rem]" />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
