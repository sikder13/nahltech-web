import { ButtonLink } from "@/components/ui/ButtonLink";
import { ImageSlot } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";

/**
 * A single large slot for the flagship research piece. One item by design —
 * the point is to put weight behind one verifiable thing rather than to list
 * several.
 */
export function FeaturedResearch({
  heading,
  title,
  excerpt,
  imageLabel,
  cta,
  href,
}: {
  heading: string;
  title: string;
  excerpt: string;
  imageLabel: string;
  cta: string;
  href: string;
}) {
  return (
    <section
      aria-labelledby="featured-research-heading"
      className="mx-auto max-w-(--container-page) px-sm py-2xl"
    >
      <FadeIn>
        <h2
          id="featured-research-heading"
          className="max-w-prose text-section text-balance text-text"
        >
          {heading}
        </h2>
        <span className="mt-xs heading-rule" aria-hidden="true" />

        <div className="mt-lg grid items-center gap-lg rounded-lg border border-divider p-md md:grid-cols-2 md:p-lg">
          <ImageSlot label={imageLabel} />
          <div>
            <h3 className="text-xl font-semibold text-balance text-text">
              {title}
            </h3>
            <p className="mt-sm text-text-muted">{excerpt}</p>
            <ButtonLink href={href} variant="secondary" className="mt-md">
              {cta}
            </ButtonLink>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
