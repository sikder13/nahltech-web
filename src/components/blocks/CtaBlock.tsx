import { PhoneLink } from "@/components/conversion/PhoneLink";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FadeIn } from "@/components/ui/FadeIn";

export type CtaAction = { label: string; href: string };

/**
 * Closing conversion section. Shared by the home, service and product
 * templates so the bottom of every page offers the same two ways to start:
 * book a slot, or call.
 */
export function CtaBlock({
  heading,
  body,
  primary,
  phone,
  orCallLabel,
}: {
  heading: string;
  body: string;
  primary: CtaAction;
  phone: CtaAction;
  orCallLabel: string;
}) {
  return (
    <section className="border-t border-divider bg-surface">
      <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
        <FadeIn>
          <h2 className="max-w-prose text-section text-balance text-text">
            {heading}
          </h2>
          <span className="mt-xs heading-rule" aria-hidden="true" />
          <p className="mt-md max-w-prose text-text-muted">{body}</p>

          <div className="mt-lg flex flex-wrap items-center gap-md">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            <span className="flex items-center gap-2xs text-sm text-text-muted">
              {orCallLabel}
              <PhoneLink label={phone.label} href={phone.href} />
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
