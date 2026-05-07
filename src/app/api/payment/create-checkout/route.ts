import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient } from "@/lib/stripe/client";
import { config } from "@/lib/config";
import { rateLimitGuard } from "@/lib/rate-limit";

/**
 * POST /api/payment/create-checkout
 *
 * Skapar en Stripe Checkout-session för 50 kr (eller STRIPE_PRICE_SEK öre).
 * Avsändare betalar vid skapande — vi sparar scope + message i session-metadata
 * så payment-success-routen kan skapa consent efter slutförd betalning.
 *
 * I test-läge hoppar vi över Stripe helt och skapar consent direkt.
 *
 * Stripe success_url redirectar tillbaka till oss med {CHECKOUT_SESSION_ID}.
 */
const Schema = z.object({
  scope: z.string().min(5).max(500),
  message: z.string().max(1000).nullable().optional()
});

export async function POST(req: Request) {
  // 3/min/IP — Stripe-Checkout-skapande ska ej spammas (potentiell kostnad
  // i fraud / Stripe-API-rate-limits)
  const limited = rateLimitGuard(req, "payment_checkout", { max: 3, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { scope, message } = parsed.data;

  // Test-läge: skippa Stripe, skapa consent direkt via fetch till befintlig route
  if (config.mode !== "live") {
    const baseUrl = config.appUrl || new URL(req.url).origin;
    const res = await fetch(`${baseUrl}/api/consent/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scope, message })
    });
    if (!res.ok) {
      return NextResponse.json({ error: "test_mode_create_failed" }, { status: 500 });
    }
    const { consentId } = (await res.json()) as { consentId: string };
    return NextResponse.json({
      checkoutUrl: `${baseUrl}/consents/${consentId}/sign?role=initiator&test_mode=1`
    });
  }

  // Live: skapa Stripe Checkout-session
  const baseUrl = config.appUrl || new URL(req.url).origin;
  const stripe = stripeClient();

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sek",
            unit_amount: config.stripe.priceSek, // i öre, t.ex. 5000 = 50 kr
            product_data: {
              name: "Samtycke via Concent",
              description: scope.length > 100 ? scope.slice(0, 97) + "..." : scope
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        // Stripe metadata har max 500 chars per värde, 50 par.
        scope: scope.slice(0, 500),
        message: (message ?? "").slice(0, 500)
      },
      success_url: `${baseUrl}/consents/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/consents/new?cancelled=1`,
      // 30 min att slutföra betalningen
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[stripe/create-checkout] failed:", err);
    return NextResponse.json(
      { error: "stripe_session_failed" },
      { status: 502 }
    );
  }

  if (!session.url) {
    return NextResponse.json({ error: "no_checkout_url" }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: session.url });
}
