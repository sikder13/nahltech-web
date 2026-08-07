import Link from "next/link";

import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost";

const base =
  "inline-flex items-center justify-center rounded-md px-sm py-2xs " +
  "text-sm font-semibold transition-colors motion-reduce:transition-none";

const variants: Record<Variant, string> = {
  // Black label on gold: 13.22:1.
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  ghost: "text-text hover:text-accent",
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
