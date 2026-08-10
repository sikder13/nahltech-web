/**
 * The honeybee.
 *
 * "Nahl" (نحل) is Arabic for honeybee — the company is named after one, which
 * makes the bee the single piece of visual territory no competitor can take.
 * It appears exactly twice on the site: here beside the wordmark, and once
 * more, larger, on the 404.
 *
 * The wings flap on hover: two paths alternating scaleY on an 80ms beat,
 * carried over in concept from the old site but rebuilt as plain CSS. No
 * library, no canvas, no JS — the animation costs nothing off the bundle.
 * Under prefers-reduced-motion the bee simply sits still, wings extended.
 *
 * The old site's bee-as-cursor is deliberately not carried forward: a custom
 * cursor fights usability on a B2B site. The bee is a mark, not a pointer.
 */
export function BeeMark({
  className = "size-6",
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 32 32"
      className={`${className} ${animate ? "bee" : ""}`.trim()}
      fill="none"
    >
      {/* Wings sit behind the body and are the only animated parts. */}
      <g className="bee-wing bee-wing-left">
        <ellipse
          cx="12"
          cy="10"
          rx="5.4"
          ry="3.2"
          transform="rotate(-28 12 10)"
          fill="currentColor"
          opacity="0.16"
        />
      </g>
      <g className="bee-wing bee-wing-right">
        <ellipse
          cx="20.5"
          cy="10"
          rx="5.4"
          ry="3.2"
          transform="rotate(28 20.5 10)"
          fill="currentColor"
          opacity="0.16"
        />
      </g>

      {/* Body: an abstracted hexagonal-shouldered oval, not a cartoon. */}
      <path
        d="M16 12.5c3.6 0 6.2 2.4 6.2 6.2S19.4 27 16 27s-6.2-4.5-6.2-8.3 2.6-6.2 6.2-6.2Z"
        fill="currentColor"
      />
      {/* Stripes, cut in the page ground so they read at 24px. */}
      <path
        d="M11.2 17.6h9.6M11.4 21.4h9.2M12.8 25h6.4"
        stroke="var(--color-bg)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Antennae. */}
      <path
        d="M14 11.4 12.2 8.2M18 11.4l1.8-3.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.4" r="1.1" fill="currentColor" />
      <circle cx="20" cy="7.4" r="1.1" fill="currentColor" />
    </svg>
  );
}
