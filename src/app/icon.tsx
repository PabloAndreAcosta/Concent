import { ImageResponse } from "next/og";

/**
 * App-ikon (192x192) som genereras dynamiskt vid request.
 * Matchar topbar-märket "C" på guld-på-svart.
 *
 * Next 14 letar automatiskt på app/icon.tsx och serverar den på /icon.
 */

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 320,
          fontWeight: 700,
          color: "#d4af37",
          letterSpacing: -16,
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
