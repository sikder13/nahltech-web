import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Prose } from "@/components/ui/Prose";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

export function StorySection({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <section className={shell}>
      <FadeIn>
        <SectionHeading>{heading}</SectionHeading>
        <Prose className="mt-md">
          <p>{body}</p>
        </Prose>
      </FadeIn>
    </section>
  );
}

export type TeamMember = { name: string; role: string };

/**
 * Team grid with neutral avatars.
 *
 * No stock photography: a placeholder face is a small lie about who works
 * here. The glyph is decorative and hidden from assistive tech — the name and
 * role beside it carry everything.
 */
export function TeamGrid({
  heading,
  members,
}: {
  heading: string;
  members: readonly TeamMember[];
}) {
  return (
    <section className="border-y border-divider bg-surface">
      <div className={shell}>
        <FadeIn>
          <SectionHeading>{heading}</SectionHeading>
          <ul className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <li key={member.name} className="flex items-center gap-sm">
                <span
                  aria-hidden="true"
                  className="flex size-14 shrink-0 items-center justify-center bg-divider hex-clip"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-7 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <circle cx="12" cy="8.5" r="3.5" />
                    <path d="M4.5 20a7.5 7.5 0 0115 0" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-text">{member.name}</p>
                  <p className="text-sm text-text-muted">{member.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </section>
  );
}

export function CredentialsRow({
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
        <ul className="mt-lg grid gap-sm sm:grid-cols-3">
          {items.map((item) => (
            <li key={item} className="flex gap-2xs text-sm text-text">
              <Icon name="check" className="mt-px size-4 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </FadeIn>
    </section>
  );
}

export type ContactChannel = {
  icon: "phone" | "mail" | "pin";
  label: string;
  value: string;
  href?: string;
};

/**
 * Phone, email and postal address. These must match the NAP in the footer and
 * the Google Business Profile exactly — inconsistent NAP is a local-SEO
 * penalty, so all three read from the same constant in lib/routes.ts.
 */
export function ContactChannels({
  heading,
  channels,
}: {
  heading: string;
  channels: readonly ContactChannel[];
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-text">{heading}</h2>
      <span className="mt-xs heading-rule" aria-hidden="true" />
      <ul className="mt-md space-y-sm">
        {channels.map((channel) => (
          <li key={channel.label} className="flex gap-sm">
            <Icon name={channel.icon} className="mt-px size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-text">{channel.label}</p>
              {channel.href ? (
                <a
                  href={channel.href}
                  className="text-sm text-text-muted link-accent hover:text-text"
                >
                  {channel.value}
                </a>
              ) : (
                <p className="text-sm whitespace-pre-line text-text-muted">
                  {channel.value}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type PricingTier = {
  name: string;
  price: string;
  unit: string;
  description: string;
  features: readonly string[];
};

export type ProjectService = { name: string; price: string };

/**
 * Three highlighted offers plus a plain list of project work.
 *
 * Deliberately not a feature-comparison matrix: the offers differ in scope,
 * not in how many checkmarks they have, and a matrix invites the reader to
 * shop on row count.
 */
export function PricingTable({
  tiersHeading,
  tiers,
  projectsHeading,
  projects,
  ctaLabel,
  ctaHref,
}: {
  tiersHeading: string;
  tiers: readonly PricingTier[];
  projectsHeading: string;
  projects: readonly ProjectService[];
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <>
      <section className={shell}>
        <FadeIn>
          <SectionHeading>{tiersHeading}</SectionHeading>
          <ul className="mt-lg grid gap-md lg:grid-cols-3">
            {tiers.map((tier) => (
              <li key={tier.name}>
                <Card className="flex h-full flex-col">
                  <h3 className="text-lg font-semibold text-text">
                    {tier.name}
                  </h3>
                  <p className="mt-2xs flex items-baseline gap-2xs">
                    <span className="text-3xl font-bold tracking-tight text-text">
                      {tier.price}
                    </span>
                    <span className="text-sm text-text-muted">{tier.unit}</span>
                  </p>
                  <p className="mt-sm text-sm text-text-muted">
                    {tier.description}
                  </p>
                  <ul className="mt-md flex-1 space-y-2xs">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-2xs text-sm text-text"
                      >
                        <Icon name="check" className="mt-px size-4 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={ctaHref}
                    className="mt-md inline-flex items-center justify-center rounded-md bg-cta px-sm py-2xs text-sm font-semibold text-on-cta hover:bg-cta-hover"
                  >
                    {ctaLabel}
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        </FadeIn>
      </section>

      <section className="border-t border-divider">
        <div className={shell}>
          <FadeIn>
            <SectionHeading>{projectsHeading}</SectionHeading>
            <dl className="mt-lg max-w-(--container-measure) divide-y divide-divider border-y border-divider">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-baseline justify-between gap-sm py-sm"
                >
                  <dt className="text-text">{project.name}</dt>
                  <dd className="font-mono text-sm text-text-muted">
                    {project.price}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
