import { siteUrl } from "@/lib/routes";

import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * Pass-through root layout.
 *
 * `<html>` and `<body>` are emitted by `[locale]/layout.tsx`, the only
 * segment that knows the language and direction. This layout exists so that
 * `not-found.tsx`, `sitemap.ts`, `robots.ts` and the metadata image
 * conventions have a root to attach to.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
