import Link from "next/link";

import { Card, ImageSlot } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { Icon, type IconName } from "@/components/ui/Icon";

import type { ReactNode } from "react";

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
}: {
  title: string;
  description: string;
  href: string;
  icon: IconName;
  delay?: number;
}) {
  return (
    <li>
      <FadeIn delay={delay} className="h-full">
        <Card interactive className="h-full">
          <Icon name={icon} className="size-6 text-text" />
          <h3 className="mt-sm text-lg font-semibold text-text">
            <Link href={href} className="link-accent">
              {title}
            </Link>
          </h3>
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
}: {
  name: string;
  description: string;
  href: string;
  status?: string;
  delay?: number;
}) {
  return (
    <li>
      <FadeIn delay={delay} className="h-full">
        <Card interactive className="h-full">
          <div className="flex items-start justify-between gap-sm">
            <h3 className="text-lg font-semibold text-text">
              <Link href={href} className="link-accent">
                {name}
              </Link>
            </h3>
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

export function ArticleCard({
  title,
  excerpt,
  href,
  meta,
  imageLabel,
  delay = 0,
}: {
  title: string;
  excerpt: string;
  href: string;
  meta: string;
  imageLabel: string;
  delay?: number;
}) {
  return (
    <li>
      <FadeIn delay={delay} className="h-full">
        <Card interactive className="h-full">
          <ImageSlot label={imageLabel} />
          <h3 className="mt-sm text-lg font-semibold text-text">
            <Link href={href} className="link-accent">
              {title}
            </Link>
          </h3>
          <p className="mt-2xs text-sm text-text-muted">{excerpt}</p>
          <p className="mt-sm text-xs text-text-muted">{meta}</p>
        </Card>
      </FadeIn>
    </li>
  );
}
