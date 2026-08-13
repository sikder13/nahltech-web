import Link from "next/link";

import { Card, ImageSlot } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon, type IconName } from "@/components/ui/Icon";

import type { ReactNode } from "react";

/**
 * Heading rank for a card's title.
 *
 * Rank is document structure, not styling — the same rule `SectionHeading`
 * follows. A card sitting directly under a page's h1 (the hubs) is an h2; a
 * card inside a section that already has its own h2 (the home page's services
 * grid, an article's related rail) is an h3.
 *
 * The default is 3 because that is the majority case and the safe one: a
 * wrong h3 is a nesting error, whereas a wrong h2 competes with the page
 * title. Getting it wrong in either direction is a heading-level skip, which
 * is what an audit flags and what a screen-reader user navigates by.
 */
export type CardHeadingLevel = 2 | 3;

function CardTitle({
  level = 3,
  className,
  children,
}: {
  level?: CardHeadingLevel;
  className: string;
  children: ReactNode;
}) {
  const Tag = level === 2 ? "h2" : "h3";
  return <Tag className={className}>{children}</Tag>;
}

/**
 * Grid wrapper for the hub card variants. Column count is a prop rather than
 * inferred from item count so a hub with two entries does not silently
 * restyle itself when a third is published.
 */
export function CardGrid({
  columns = 3,
  children,
}: {
  columns?: 2 | 3 | 4;
  children: ReactNode;
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return <ul className={`grid gap-md ${cols}`}>{children}</ul>;
}

export function ServiceCard({
  title,
  description,
  href,
  icon,
  delay = 0,
  level,
}: {
  title: string;
  description: string;
  href: string;
  icon: IconName;
  delay?: number;
  level?: CardHeadingLevel;
}) {
  return (
    <li>
      <FadeIn delay={delay} className="h-full">
        <Card interactive className="h-full">
          <Icon name={icon} className="size-6 text-text" />
          <CardTitle
            level={level}
            className="mt-sm text-lg font-semibold text-text"
          >
            <Link href={href} className="link-accent">
              {title}
            </Link>
          </CardTitle>
          <p className="mt-2xs text-sm text-text-muted">{description}</p>
        </Card>
      </FadeIn>
    </li>
  );
}

export function ProductCard({
  name,
  description,
  href,
  status,
  delay = 0,
  level,
}: {
  name: string;
  description: string;
  href: string;
  status?: string;
  delay?: number;
  level?: CardHeadingLevel;
}) {
  return (
    <li>
      <FadeIn delay={delay} className="h-full">
        <Card interactive className="h-full">
          <div className="flex items-start justify-between gap-sm">
            <CardTitle
              level={level}
              className="text-lg font-semibold text-text"
            >
              <Link href={href} className="link-accent">
                {name}
              </Link>
            </CardTitle>
            {status ? (
              <span className="rounded-sm border border-border px-3xs py-px text-xs text-text-muted">
                {status}
              </span>
            ) : null}
          </div>
          <p className="mt-2xs text-sm text-text-muted">{description}</p>
        </Card>
      </FadeIn>
    </li>
  );
}

/**
 * Research artifact on the hub.
 *
 * Carries a kind badge rather than an image slot: these are documents, and the
 * useful signal at a glance is what kind of document it is — a walkthrough of
 * a fictional engagement reads very differently from the published method.
 * Same badge treatment as ProductCard's status, for the same reason.
 */
export function ResearchCard({
  title,
  description,
  href,
  kindLabel,
  meta,
  delay = 0,
  level,
}: {
  title: string;
  description: string;
  href: string;
  kindLabel: string;
  meta: string;
  delay?: number;
  level?: CardHeadingLevel;
}) {
  return (
    <li>
      <FadeIn delay={delay} className="h-full">
        <Card interactive className="flex h-full flex-col">
          <p className="font-mono caption">{kindLabel}</p>
          <CardTitle
            level={level}
            className="mt-2xs text-lg font-semibold text-balance text-text"
          >
            <Link href={href} className="link-accent">
              {title}
            </Link>
          </CardTitle>
          <p className="mt-2xs text-sm text-text-muted">{description}</p>
          <p className="mt-auto pt-sm text-xs text-text-muted">{meta}</p>
        </Card>
      </FadeIn>
    </li>
  );
}

export function ArticleCard({
  title,
  excerpt,
  href,
  meta,
  imageLabel,
  delay = 0,
  level,
}: {
  title: string;
  excerpt: string;
  href: string;
  meta: string;
  imageLabel: string;
  delay?: number;
  level?: CardHeadingLevel;
}) {
  return (
    <li>
      <FadeIn delay={delay} className="h-full">
        <Card interactive className="h-full">
          <ImageSlot label={imageLabel} />
          <CardTitle
            level={level}
            className="mt-sm text-lg font-semibold text-text"
          >
            <Link href={href} className="link-accent">
              {title}
            </Link>
          </CardTitle>
          <p className="mt-2xs text-sm text-text-muted">{excerpt}</p>
          <p className="mt-sm text-xs text-text-muted">{meta}</p>
        </Card>
      </FadeIn>
    </li>
  );
}
