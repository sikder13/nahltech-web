/**
 * Inline icon set.
 *
 * Every icon is decorative: it sits beside a text label that carries the
 * meaning. That matters because icons stroked in the accent would sit at
 * 1.59:1, so they must never be the only signal. They inherit `currentColor`
 * and are `aria-hidden`.
 */
export type IconName =
  | "product"
  | "app"
  | "research"
  | "method"
  | "observe"
  | "analyze"
  | "quantify"
  | "build"
  | "search"
  | "sparkle"
  | "phone"
  | "mail"
  | "pin"
  | "check";

const paths: Record<IconName, string> = {
  product: "M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4",
  app: "M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm4 15h2",
  research: "M11 4a7 7 0 100 14 7 7 0 000-14zm5 12l5 5",
  method: "M4 6h16M4 12h10M4 18h7",
  observe:
    "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zm10 3a3 3 0 100-6 3 3 0 000 6z",
  analyze: "M4 20V9m5 11V4m5 16v-7m5 7V7",
  quantify: "M4 19h16M7 16V8m5 8V5m5 11v-6",
  build: "M14 6l4 4-8 8H6v-4l8-8zm0 0l2-2a2 2 0 013 3l-2 2",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zm5 12l5 5",
  sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z",
  phone:
    "M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z",
  mail: "M3 6h18v12H3zM3 6l9 7 9-7",
  pin: "M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zm0-8a3 3 0 100-6 3 3 0 000 6z",
  check: "M4 12l5 5L20 6",
};

export function Icon({
  name,
  className = "size-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
