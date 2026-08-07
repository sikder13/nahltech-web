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
 * [PLACEHOLDER: brand OG treatment — wordmark on black until artwork exists.]
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
        backgroundColor: "#000000",
        padding: "80px",
      }}
    >
      <div
        style={{
          width: "120px",
          height: "8px",
          backgroundColor: "#f5c842",
          marginBottom: "40px",
        }}
      />
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          color: "#f5c842",
          letterSpacing: "-0.02em",
        }}
      >
        {t.site.name}
      </div>
    </div>,
    size,
  );
}
