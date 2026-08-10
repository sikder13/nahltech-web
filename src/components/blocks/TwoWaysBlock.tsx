import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";

export type WayPanel = { label: string; body: string };

/**
 * The core positioning visual: the two routes a customer now takes to find
 * a business — typing a query into a search engine, or asking an assistant.
 *
 * Rendered as a definition list rather than two loose divs so the pairing is
 * conveyed structurally and not only by the side-by-side layout, which
 * collapses to stacked on small screens.
 */
export function TwoWaysBlock({
  heading,
  google,
  ai,
}: {
  heading: string;
  google: WayPanel;
  ai: WayPanel;
}) {
  const panels = [
    { icon: "search" as const, ...google },
    { icon: "sparkle" as const, ...ai },
  ];

  return (
    <section
      aria-labelledby="two-ways-heading"
      className="mx-auto max-w-(--container-page) px-sm py-2xl"
    >
      <FadeIn>
        <h2
          id="two-ways-heading"
          className="max-w-prose text-section text-balance text-text"
        >
          {heading}
        </h2>
        <span className="mt-xs heading-rule" aria-hidden="true" />

        <dl className="mt-lg grid gap-md md:grid-cols-2">
          {panels.map((panel) => (
            <div
              key={panel.label}
              className="rounded-lg border border-divider bg-surface p-lg"
            >
              <dt className="flex items-center gap-2xs text-lg font-semibold text-text">
                <Icon name={panel.icon} className="size-5" />
                {panel.label}
              </dt>
              <dd className="mt-sm text-text-muted">{panel.body}</dd>
            </div>
          ))}
        </dl>
      </FadeIn>
    </section>
  );
}
