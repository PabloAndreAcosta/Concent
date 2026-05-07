import withPWA from "next-pwa";

/**
 * next-pwa genererar service worker från workbox.
 *
 * Strategi:
 *   - dest: "public" → sw.js + workbox-*.js läggs i /public/ (auto vid build)
 *   - disable i dev → enklare debugging, ingen aggressiv caching
 *   - register/skipWaiting → ny version aktiveras direkt vid uppdatering
 *
 * Push-notifikationer: stödjs i iOS 16.4+ för installerade PWA:n. Vi använder
 * dem ENDAST för transaktionella events enligt AGENTS.md (ingen "påminn motpart").
 */
const pwa = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Vi cachar inte BankID-callbacks eller API:er — dessa ska alltid gå färska
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^\/api\/.*/,
      handler: "NetworkOnly"
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|webp|woff2)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "concent-assets",
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: false }
};

export default pwa(nextConfig);
