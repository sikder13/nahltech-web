import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";

export type WayPanel = { label: string; body: string };

/**
 * The core positioning visual: the two routes a customer now takes to find a
 * business — typing a query into a search engine, or asking an assistant.
 *
 * Built as a diptych rather than two matching cards, because the whole point
 * is that the two experiences are not alike. The left panel is a ranked list
 * introduced by a monospace query; the right is one synthesised answer set in
 * the display serif on the tinted ground, with no ranking at all. The form
 * makes the argument before the copy does, and a single full-height seam
 * divides them.
 *
 * It stays a definition list underneath, so the pairing survives when the
 * panels stack on small screens and the visual contrast is gone.
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

        <dl className="mt-lg grid overflow-hidden rounded-lg border border-divider md:grid-cols-2">
          {/* Left: the ranked-list world. */}
          <div className="border-b border-divider bg-bg p-lg md:border-e md:border-b-0">
            <dt className="flex items-center gap-2xs caption">
              <Icon name="search" className="size-4" />
              {google.label}
            </dt>

            <dd>
              <p className="mt-md font-mono text-sm text-text-muted">
                <span aria-hidden="true">&gt; </span>
                [query]
              </p>

              <ol className="mt-md space-y-2xs" aria-hidden="true">
                {[0, 1, 2].map((rank) => (
                  <li key={rank} className="flex items-center gap-2xs">
                    <span className="font-mono text-xs text-text-muted">
                      {rank + 1}
                    </span>
                    <span className="h-px flex-1 bg-divider" />
                  </li>
                ))}
              </ol>

              <p className="mt-md text-sm text-text-muted">{google.body}</p>
            </dd>
          </div>

          {/* Right: the single-answer world. */}
          <div className="bg-surface p-lg">
            <dt className="flex items-center gap-2xs font-display text-lg text-text">
              <Icon name="sparkle" className="size-4" />
              {ai.label}
            </dt>

            <dd>
              <p className="mt-md font-display text-lg text-text-muted italic">
                “[prompt]”
              </p>

              <div
                aria-hidden="true"
                className="mt-md space-y-2xs border-s-2 border-accent ps-sm"
              >
                <span className="block h-px w-full bg-divider" />
                <span className="block h-px w-11/12 bg-divider" />
                <span className="block h-px w-4/5 bg-divider" />
              </div>

              <p className="mt-md text-sm text-text-muted">{ai.body}</p>
            </dd>
          </div>
        </dl>
      </FadeIn>
    </section>
  );
}
