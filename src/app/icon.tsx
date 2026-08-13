import { readFileSync } from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon: the official hex mark.
 *
 * Built from the square variant rather than the tight crop, because a favicon
 * is rendered in a square box — letting the browser letterbox a 179x192 image
 * would shave the hexagon's points.
 *
 * Inlined as a data URI: Satori cannot read from the filesystem while
 * rendering, so the bytes have to be in the element.
 */
const markDataUri = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "public/images/logo-hex-square.png"),
).toString("base64")}`;

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Satori renders this to a PNG at build time; next/image has no
          meaning inside an ImageResponse. */}
      <img src={markDataUri} alt="" width={32} height={32} />
    </div>,
    size,
  );
}
