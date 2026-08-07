import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon via the file convention.
 *
 * [PLACEHOLDER: brand mark — gold monogram on black until the asset exists.]
 */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000000",
        color: "#f5c842",
        fontSize: 24,
        fontWeight: 700,
      }}
    >
      N
    </div>,
    size,
  );
}
