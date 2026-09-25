import { fraunces, inter } from "@/app/fonts";

import type { ReactNode } from "react";

import "@/styles/globals.css";

/**
 * Root layout for template 2 prospect dashboards (`/m2/<token>`), identical to
 * the frozen `/m` layout.
 *
 * A sibling of `[locale]/layout.tsx`, not a child, and that is the point of
 * it. The site shell mounts the header navigation, the chat widget and GA4
 * on every page. A dashboard is the continuation of a private letter: one
 * reader, no navigation, and a written promise that visiting leaves no trail
 * anyone will act on. So this shell carries the brand faces and tokens and
 * nothing else. GA4 in particular must never be added here; the only
 * measurement on these pages is the bare count in /api/visit2.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
