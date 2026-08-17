import { ButtonLink } from "@/components/ui/ButtonLink";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Prose } from "@/components/ui/Prose";
import { getTeamPhoto } from "@/lib/team-photos";

const shell = "mx-auto max-w-(--container-page) px-sm py-2xl";

export function StorySection({
  heading,
  paragraphs,
}: {
  heading: string;
  paragraphs: readonly string[];
}) {
  return (
    <section className={shell}>
      <FadeIn>
        <SectionHeading>{heading}</SectionHeading>
        <Prose className="mt-md">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </Prose>
      </FadeIn>
    </section>
  );
}

export type TeamMember = {
  name: string;
  role: string;
  /** Alt text for the photograph, when this person has one. */
  photoAlt?: string;
};

/**
 * Team row: a small hexagonal portrait, the name, and one line of title.
 *
 * A photograph appears only for someone in `teamPhotos`. Everyone else keeps
 * the neutral glyph — no stock photography, because a placeholder face is a
 * small lie about who works here.
 *
 * The portraits are deliberately small. They sit beside a name at 56px and
 * appear nowhere else on the site, which is the founder's requirement and the
 * reason there is no larger variant to reach for.
 *
 * A plain `<img>` rather than `next/image`, and this one is a correction to
 * ARCH-1 §7 rather than a reading of it: the document named team photography
 * as the case that would END the logo's exception. Measured on this page, both
 * ways, it is the case that extends it. `/about` builds at 145 kB with an
 * `<img>` and 150 kB with `next/image` — over the 145 kB ceiling, to
 * re-derive assets that are already exactly right.
 *
 * The reason it lands that way is that the conditions behind the logo
 * exception are all present here too: the render size is fixed at 56px, and
 * `scripts/build-team-avatars.mjs` emits precisely the 1x and 2x files that
 * size needs. What `next/image` is for — a content image of unknown size that
 * needs responsive variants — is not what this is. Explicit `width`/`height`
 * keep it out of the CLS budget and `srcset` covers retina, so nothing the
 * component would have given us is lost.
 *
 * If a larger portrait ever ships, this reasoning expires with it.
 */
export function TeamGrid({
  heading,
  members,
}: {
  heading: string;
  members: readonly TeamMember[];
}) {
  return (
    <section className="bg-surface">
      <div className={shell}>
        <FadeIn>
          <SectionHeading>{heading}</SectionHeading>
          <ul className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const photo = getTeamPhoto(member.name);

              return (
                <li key={member.name} className="flex items-center gap-sm">
                  {photo && member.photoAlt ? (
                    /* eslint-disable-next-line @next/next/no-img-element --
                       measured: next/image costs 5 kB gz on this page and puts
                       it over the budget, to optimise a fixed 56px asset that
                       is already the right bytes. See the block comment. */
                    <img
                      src={photo.src}
                      srcSet={`${photo.src} 1x, ${photo.src2x} 2x`}
                      alt={member.photoAlt}
                      width={56}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="size-14 shrink-0 object-cover hex-clip"
                    />
                  ) : (
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
                  )}
                  <div>
                    <p className="font-semibold text-text">{member.name}</p>
                    <p className="text-sm text-text-muted">{member.role}</p>
                  </div>
                </li>
              );
            })}
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
  footnote: string;
  ctaLabel: string;
  featured: boolean;
};

export type ProjectService = { name: string; price: string; note: string };

/**
 * Founding-client band.
 *
 * The count is a plain dictionary value that a human edits. Deliberately not
 * a live counter and deliberately not a timer: the copy says it is not a
 * countdown gimmick, so the implementation must not make it one.
 */
export function FoundingBanner({
  heading,
  body,
}: {
  heading: string;
  body: string;
}) {
  return (
    <section className="border-y-2 border-accent bg-surface">
      <div className="mx-auto max-w-(--container-page) px-sm py-lg">
        <FadeIn>
          <h2 className="text-xl font-semibold text-text">{heading}</h2>
          <p className="mt-2xs max-w-prose text-sm text-text-muted">{body}</p>
        </FadeIn>
      </div>
    </section>
  );
}

/**
 * Three offers plus the build-and-retainer list.
 *
 * Not a feature-comparison matrix: the offers differ in scope, not in how
 * many checkmarks they carry, and a matrix invites shopping on row count.
 * The featured card is marked by a border and a label, never by colour
 * alone.
 */
export function PricingTable({
  tiers,
  projectsHeading,
  projects,
  featuredLabel,
  ctaHref,
}: {
  tiers: readonly PricingTier[];
  projectsHeading: string;
  projects: readonly ProjectService[];
  featuredLabel: string;
  ctaHref: string;
}) {
  return (
    <>
      <section className={shell}>
        <ul className="grid gap-md lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <li key={tier.name}>
              <FadeIn delay={index * 0.06} className="h-full">
                <div
                  className={`flex h-full flex-col rounded-lg p-lg ${
                    tier.featured
                      ? "border-2 border-text bg-bg"
                      : "border border-divider bg-surface"
                  }`}
                >
                  {tier.featured ? (
                    <p className="mb-2xs caption">{featuredLabel}</p>
                  ) : null}
                  <h3 className="text-lg font-semibold text-text">
                    {tier.name}
                  </h3>
                  <p className="mt-2xs flex flex-wrap items-baseline gap-2xs">
                    <span className="text-3xl font-bold tracking-tight text-text tabular-nums">
                      {tier.price}
                    </span>
                    {tier.unit ? (
                      <span className="text-sm text-text-muted">
                        {tier.unit}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-sm flex-1 text-sm text-text-muted">
                    {tier.description}
                  </p>
                  {tier.footnote ? (
                    <p className="mt-sm border-t border-divider pt-sm text-xs text-text-muted">
                      {tier.footnote}
                    </p>
                  ) : null}
                  <ButtonLink href={ctaHref} className="mt-md">
                    {tier.ctaLabel}
                  </ButtonLink>
                </div>
              </FadeIn>
            </li>
          ))}
        </ul>
      </section>

      <section className={shell}>
        <FadeIn>
          <SectionHeading>{projectsHeading}</SectionHeading>
          <dl className="mt-lg max-w-(--container-measure) divide-y divide-divider border-y border-divider">
            {projects.map((project) => (
              <div key={project.name} className="py-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2xs">
                  <dt className="font-medium text-text">{project.name}</dt>
                  <dd className="font-mono text-sm text-text tabular-nums">
                    {project.price}
                  </dd>
                </div>
                <p className="mt-3xs text-sm text-text-muted">{project.note}</p>
              </div>
            ))}
          </dl>
        </FadeIn>
      </section>
    </>
  );
}

export function DiscountsBlock({
  heading,
  items,
  community,
  footnote,
}: {
  heading: string;
  items: readonly string[];
  community: string;
  footnote: string;
}) {
  return (
    <section className="bg-surface">
      <div className={shell}>
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
          <p className="mt-md max-w-prose border-s-4 border-accent ps-md text-text">
            {community}
          </p>
          <p className="mt-md text-xs text-text-muted">{footnote}</p>
        </FadeIn>
      </div>
    </section>
  );
}
