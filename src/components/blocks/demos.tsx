import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

/**
 * Demonstration blocks.
 *
 * Each service demonstrates itself in a different form, because a page that
 * proves five different things with one layout is a template wearing five
 * hats. Same tokens throughout — the variation is structural, not decorative,
 * and nothing here introduces a colour.
 *
 * Software Development keeps plain prose on purpose: with four structured
 * neighbours, the narrative one is the variation.
 */
function DemoShell({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface">
      <div className={shell}>
        <FadeIn>
          <SectionHeading>{heading}</SectionHeading>
          {children}
        </FadeIn>
      </div>
    </section>
  );
}

/** AI Consultancy — an annotated case, read down a labelled rail. */
export function DemoCasePanel({
  heading,
  rows,
  closing,
}: {
  heading: string;
  rows: readonly { label: string; body: string }[];
  closing: string;
}) {
  return (
    <DemoShell heading={heading}>
      <dl className="mt-lg max-w-(--container-measure) border-s border-divider">
        {rows.map((row) => (
          <div key={row.label} className="ps-md pb-md last:pb-0">
            <dt className="caption">{row.label}</dt>
            <dd className="mt-3xs text-text">{row.body}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-lg max-w-prose text-text-muted">{closing}</p>
    </DemoShell>
  );
}

/** AI Search Visibility — a thing you can go and do, right now. */
export function DemoInstructionCard({
  heading,
  chip,
  steps,
  closing,
}: {
  heading: string;
  chip: string;
  steps: readonly string[];
  closing: string;
}) {
  return (
    <DemoShell heading={heading}>
      <div className="mt-lg max-w-(--container-card) rounded-lg border border-border bg-bg p-lg">
        <span className="inline-block rounded-sm border border-divider px-2xs py-3xs caption">
          {chip}
        </span>
        <ol className="mt-md space-y-sm">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-sm">
              <span className="font-mono text-sm text-text-muted tabular-nums">
                {index + 1}
              </span>
              <span className="text-text">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-lg max-w-prose text-text-muted">{closing}</p>
    </DemoShell>
  );
}

/** AI Automation — the arithmetic, shown as arithmetic. */
export function DemoCalculation({
  heading,
  lead,
  rows,
  total,
  note,
  closing,
}: {
  heading: string;
  lead: string;
  rows: readonly { label: string; value: string }[];
  total: { label: string; value: string };
  note: string;
  closing: string;
}) {
  return (
    <DemoShell heading={heading}>
      <p className="mt-md text-text">{lead}</p>
      <dl className="mt-md max-w-(--container-measure) font-mono text-sm tabular-nums">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between gap-sm border-b border-divider py-2xs"
          >
            <dt className="text-text-muted">{row.label}</dt>
            <dd className="text-text">{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-sm border-b-2 border-text py-2xs font-semibold">
          <dt className="text-text">{total.label}</dt>
          <dd className="text-text">{total.value}</dd>
        </div>
      </dl>
      <p className="mt-2xs max-w-prose text-xs text-text-muted">{note}</p>
      <p className="mt-lg max-w-prose text-text-muted">{closing}</p>
    </DemoShell>
  );
}

/**
 * Web Development — four things a sceptic can verify.
 *
 * Only the Crawlmouse row has somewhere to go; the rest are actions the
 * reader performs in their own browser. Those render as plain rows rather
 * than links, because an anchor with no destination is a dead link.
 */
export function DemoChecklist({
  heading,
  items,
  closing,
}: {
  heading: string;
  items: readonly { label: string; href: string }[];
  closing: string;
}) {
  return (
    <DemoShell heading={heading}>
      <ul className="mt-lg max-w-(--container-measure) divide-y divide-divider border-y border-divider">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-sm py-sm">
            <Icon name="check" className="size-4 shrink-0 text-text-muted" />
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2xs text-text link-accent"
              >
                {item.label}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="size-3.5"
                >
                  <path
                    d="M6 3h7v7M13 3L4 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            ) : (
              <span className="text-text">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-lg max-w-prose text-text-muted">{closing}</p>
    </DemoShell>
  );
}

/** Software Development — prose, and the only one. */
export function DemoProse({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <DemoShell heading={heading}>
      <p className="mt-lg max-w-prose text-lg text-text-muted">{body}</p>
    </DemoShell>
  );
}
