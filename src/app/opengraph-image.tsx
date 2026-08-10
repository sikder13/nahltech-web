import { ImageResponse } from "next/og";

import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Nahl Technologies";

/**
 * Default Open Graph image, generated at build time via the file convention.
 * Nothing references a static /og-image.png path — the old site's did, and it
 * 404s on X today (ARCH-1 §7).
 *
 * Light theme, matching the site: dark wordmark on white with the gold rule
 * as decoration. Gold is not used for the lettering — the same 1.59:1 reason
 * it is never used for text anywhere else.
 *
 * [PLACEHOLDER: logo artwork — typeset wordmark until the mark is supplied.]
 */
export default async function OpengraphImage() {
  const t = await getDictionary(defaultLocale);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        backgroundColor: "#ffffff",
        padding: "80px",
      }}
    >
      <svg
        width="96"
        height="110"
        viewBox="0 0 96 110"
        style={{ marginBottom: "40px" }}
      >
        <path
          d="M48 3 L92 28 V82 L48 107 L4 82 V28 Z"
          fill="none"
          stroke="#f5c842"
          strokeWidth="3"
        />
        <path
          d="M48 21 L76 37 V69 L48 85 L20 69 V37 Z"
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="2"
        />
      </svg>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: "#111111",
          letterSpacing: "-0.02em",
        }}
      >
        {t.site.name}
      </div>
    </div>,
    size,
  );
}
