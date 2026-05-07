/**
 * Stripe server-side klient.
 *
 * Cachad så vi inte återskapar den per request. Server-only — STRIPE_SECRET_KEY
 * får aldrig nå klienten.
 */
import Stripe from "stripe";
import { config } from "@/lib/config";

let cachedStripe: Stripe | null = null;

export function stripeClient(): Stripe {
  if (cachedStripe) return cachedStripe;

  if (!config.stripe.secretKey) {
    throw new Error(
      "Stripe-klient används utan STRIPE_SECRET_KEY. Sätt env eller använd test-läge."
    );
  }

  cachedStripe = new Stripe(config.stripe.secretKey, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: {
      name: "Concent",
      version: "0.1.0",
      url: "https://concent.usha.se"
    }
  });

  return cachedStripe;
}
