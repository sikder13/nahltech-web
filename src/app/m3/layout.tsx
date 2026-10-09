import { fraunces, inter } from "@/app/fonts";

import type { ReactNode } from "react";

import "@/styles/globals.css";

/**
 * Root layout for letter pages (`/m3/<token>`), the same shell as the
 * dashboards at `/m` and `/m2`.
 *
 * A sibling of `[locale]/layout.tsx`, not a child. The site shell mounts the
 * header navigation, the chat widget and GA4 on every page; a letter page is
 * the second half of a private letter and carries none of them. GA4 in
 * particular must never be added here; the only measurement on these pages
 * is the bare count in /api/visit3.
 */
export default function LetterLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
