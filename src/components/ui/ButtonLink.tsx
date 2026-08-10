import Link from "next/link";

import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-md px-sm py-2xs " +
  "text-sm font-semibold transition-colors motion-reduce:transition-none";

const variants: Record<Variant, string> = {
  // Solid dark on white, white label: 18.88:1. Never gold — #F5C842 as a
  // button fill would put the label at 1.59:1 against the page.
  primary: "bg-cta text-on-cta hover:bg-cta-hover",
  ghost: "link-accent text-text",
};

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Link>
  );
}
