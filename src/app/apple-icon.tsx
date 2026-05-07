import { ImageResponse } from "next/og";

/**
 * Apple Touch Icon (180x180) — används av iOS Safari vid "Add to Home Screen".
 * Inga rundade hörn — iOS lägger till dem automatiskt med rätt radius.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
          fontSize: 120,
          fontWeight: 700,
          color: "#d4af37",
          letterSpacing: -6,
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
