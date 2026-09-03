import { PhoneLink } from "@/components/conversion/PhoneLink";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { FadeIn } from "@/components/ui/FadeIn";

export type CtaAction = { label: string; href: string; external?: boolean };

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
  phoneNote,
}: {
  heading: string;
  /**
   * Optional because three of the four market pages close on a single
   * approved sentence and have no second one. Absent, the paragraph is not
   * rendered rather than rendered empty — the same treatment `phoneNote`
   * gets, and every page that passed a body before renders unchanged.
   */
  body?: string;
  primary: CtaAction;
  phone: CtaAction;
  orCallLabel: string;
  /**
   * Trailing aside after the number — "a real person answers". Optional, so
   * the four pages that closed with this block before still render exactly
   * as they did; only a page whose approved copy carries the line passes it.
   */
  phoneNote?: string;
}) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-(--container-page) px-sm py-2xl">
        <FadeIn>
          <h2 className="max-w-prose text-section text-balance text-text">
            {heading}
          </h2>
          <span className="mt-xs heading-rule" aria-hidden="true" />
          {body ? (
            <p className="mt-md max-w-prose text-text-muted">{body}</p>
          ) : null}

          <div className="mt-lg flex flex-wrap items-center gap-md">
            <ButtonLink href={primary.href} external={primary.external}>
              {primary.label}
            </ButtonLink>
            <span className="flex items-center gap-2xs text-sm text-text-muted">
              {orCallLabel}
              <PhoneLink label={phone.label} href={phone.href} />
              {phoneNote ? <span>{`— ${phoneNote}`}</span> : null}
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
