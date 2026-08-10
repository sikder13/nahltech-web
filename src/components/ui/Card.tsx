import type { ElementType, ReactNode } from "react";

/**
 * Neutral surface panel. `interactive` adds the hover affordance used by the
 * clickable cards in the hubs; it deliberately does not imply a link on its
 * own, so the card's own anchor still carries the semantics.
 */
export function Card({
  as: Tag = "div",
  interactive = false,
  className = "",
  children,
}: {
  as?: ElementType;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={[
        "rounded-lg border border-divider bg-surface p-md",
        interactive &&
          "transition-colors hover:border-border motion-reduce:transition-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

/**
 * Stand-in for imagery. No raw images are committed to this repo (hard rule
 * 2), so slots render as a token-coloured panel until real assets exist.
 */
export function ImageSlot({
  label,
  className = "",
  ratio = "aspect-16/9",
}: {
  label: string;
  className?: string;
  ratio?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex hex-watermark ${ratio} items-center justify-center rounded-md border border-divider ${className}`}
    >
      <span className="px-sm text-center text-xs text-text-muted">{label}</span>
    </div>
  );
}
