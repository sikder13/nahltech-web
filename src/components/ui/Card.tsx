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
          "transition duration-150 hover:-translate-y-0.5 hover:border-border hover:shadow-md motion-reduce:translate-y-0 motion-reduce:transition-none",
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
      className={`relative flex ${ratio} items-center justify-center overflow-hidden rounded-md border border-divider bg-surface ${className}`}
    >
      {/* A real honeycomb, at divider strength. This is the one repeating
          hexagon on the site: there is no text over it, and it reads as
          "artwork pending" rather than decorating a live surface. */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full text-divider"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="hex-watermark"
            width="56"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M14 0 L28 8 L28 24 L14 32 L0 24 L0 8 Z M42 0 L56 8 L56 24 L42 32 L28 24 L28 8 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-watermark)" />
      </svg>

      <span className="relative px-sm text-center text-xs text-text-muted">
        {label}
      </span>
    </div>
  );
}
