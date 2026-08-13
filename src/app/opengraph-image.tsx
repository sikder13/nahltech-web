import { readFileSync } from "node:fs";
import path from "node:path";

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
 * Light theme, matching the site: the official mark and a dark wordmark on
 * white. Gold is not used for the lettering — the same 1.59:1 reason it is
 * never used for text anywhere else.
 *
 * The mark is inlined as a data URI because Satori cannot fetch from the
 * filesystem or a relative path while rendering.
 */
const markDataUri = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "public/images/logo-hex.png"),
).toString("base64")}`;
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
      {/* Satori renders this to a PNG at build time; next/image has no
          meaning inside an ImageResponse. */}
      <img
        src={markDataUri}
        alt=""
        width={112}
        height={120}
        style={{ marginBottom: "40px" }}
      />
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
