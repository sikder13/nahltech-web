import { Fraunces, Inter } from "next/font/google";

/**
 * The two brand faces, declared once for both root layouts: the site shell
 * in `[locale]/layout.tsx` and the prospect dashboards in `m/layout.tsx`.
 *
 * Inter is the brand typeface. Self-hosted at build time by next/font — the
 * files are served from our own origin, so the page makes no request to a
 * third-party font host.
 */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Display face, h1/h2 only. Two weights, latin subset — the whole family is
 * one file under the font budget in ARCH-1 §7.
 */
export const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  variable: "--font-fraunces",
});
