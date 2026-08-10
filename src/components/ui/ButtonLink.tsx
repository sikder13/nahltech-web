import Link from "next/link";

import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "relative inline-flex items-center justify-center gap-2xs overflow-hidden " +
  "rounded-md px-sm py-2xs text-sm font-semibold transition-colors " +
  "motion-reduce:transition-none";

/**
 * The primary button's gold underline slides in from the leading edge on
 * hover. It is decoration layered on top of an already-compliant control —
 * the 18.88:1 label carries the meaning, so the 1.59:1 gold never has to.
 */
const goldSlide =
  "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-accent " +
  "after:origin-left after:scale-x-0 after:transition-transform " +
  "after:duration-150 hover:after:scale-x-100 " +
  "motion-reduce:after:transition-none";

const variants: Record<Variant, string> = {
  // Solid dark on white, white label: 18.88:1. Never gold — #F5C842 as a
  // button fill would put the label at 1.59:1 against the page.
  primary: `bg-cta text-on-cta hover:bg-cta-hover ${goldSlide}`,
  // Outlined. Uses --color-border (4.54:1), not --color-divider: this is the
  // boundary of an interactive control, so WCAG 1.4.11 applies.
  secondary: "border border-border text-text hover:bg-surface",
  ghost: "link-accent px-0 text-text",
};

/**
 * Set `external` for links that leave the site. It adds the usual rel
 * hardening plus an arrow glyph, and renders a plain anchor rather than
 * next/link, which has nothing to prefetch off-origin.
 */
export function ButtonLink({
  href,
  variant = "primary",
  external = false,
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  external?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  const classes = `${base} ${variants[variant]} ${className}`.trim();

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5">
          <path
            d="M6 3h7v7M13 3L4 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
