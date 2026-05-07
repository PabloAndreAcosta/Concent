import type { MetadataRoute } from "next";

/**
 * Web App Manifest. Driver "Add to Home Screen" / installable PWA-upplevelse
 * på både iOS Safari (16+) och Android Chrome.
 *
 * Designprinciper:
 *   - display: "standalone" → ingen browser-chrome, känns som native app
 *   - theme_color: Usha-svart (matchar topbar)
 *   - background_color: svart (smidig boot-upplevelse)
 *   - icons genereras dynamiskt via app/icon.tsx + app/apple-icon.tsx
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Concent — Samtycke med eftertanke",
    short_name: "Concent",
    description:
      "Digitalt samtyckesregister med BankID. 3 dagar mellan signering och aktivering. En produkt från Usha.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "sv-SE",
    categories: ["lifestyle", "social", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
