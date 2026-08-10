import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon: an N inside the hexagon.
 *
 * Same geometry as the rest of the site, at the one size where the bee would
 * turn to mush. The letter is a positioned div rather than an SVG <text>
 * node, which Satori cannot rasterise.
 *
 * [PLACEHOLDER: brand mark — typeset monogram until the asset exists.]
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <path
          d="M16 1.5 28.5 8.75 V23.25 L16 30.5 L3.5 23.25 V8.75 Z"
          fill="#111111"
        />
      </svg>
      <div
        style={{
          position: "relative",
          display: "flex",
          color: "#ffffff",
          fontSize: 17,
          fontWeight: 700,
        }}
      >
        N
      </div>
    </div>,
    size,
  );
}
