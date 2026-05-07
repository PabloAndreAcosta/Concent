import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe/client";
import { config } from "@/lib/config";
import { serviceClient } from "@/lib/supabase/client";

/**
 * Stripe webhook: backstop för avbrutna betalningsflöden.
 *
 * Scenariot: användaren betalar, browser stängs innan Stripe redirectar
 * tillbaka till /consents/payment-success. Pengar är tagna men ingen
 * consent skapad i vår databas.
 *
 * Webhook-flow:
 *   - Stripe POST:ar `checkout.session.completed` strax efter betalning
 *   - Vi verifierar signaturen mot STRIPE_WEBHOOK_SECRET
 *   - Vi skapar consent (idempotent via unique constraint på payment_intent_id)
 *   - Användaren kan sedan komma tillbaka senare och hitta sin consent
 *
 * Race med payment-success-page:
 *   - Båda försöker skapa consent med samma payment_intent_id
 *   - Unique constraint vinner — den senare får 23505 SQLSTATE och hämtar
 *     existerande rad istället för att skapa duplikat
 *
 * Säkerhet:
 *   - Stripe signaturen är HMAC-SHA-256 med STRIPE_WEBHOOK_SECRET
 *   - Vi använder stripe.webhooks.constructEvent() för säker verifiering
 *   - Råbody krävs (inte JSON-parsad) → vi läser req.text()
 *
 * Konfigurera webhook i Stripe dashboard:
 *   URL: https://concent.usha.se/api/stripe/webhook
 *   Events: checkout.session.completed
 */

// Next.js needs to know we're handling raw body
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ConsentRow {
  id: string;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<{ ok: boolean; consent_id?: string; reason?: string }> {
  if (session.payment_status !== "paid") {
    return { ok: false, reason: "not_paid" };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    return { ok: false, reason: "no_payment_intent" };
  }

  const sb = serviceClient();

  // Idempotens: kolla först om consent redan skapats av success-page
  const { data: existing } = await sb
    .from("consents")
    .select("id")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle<ConsentRow>();

  if (existing) {
    return { ok: true, consent_id: existing.id, reason: "already_exists" };
  }

  const scope = session.metadata?.scope ?? "";
  const message = session.metadata?.message || null;

  if (!scope) {
    return { ok: false, reason: "missing_scope_in_metadata" };
  }

  // Skapa consent. Om unique constraint smäller (race med success-page) →
  // SQLSTATE 23505 → vi behandlar det som idempotent success.
  const { data: created, error: insertErr } = await sb
    .from("consents")
    .insert({
      initiator_pno_hash: `pending_payment_${paymentIntentId}`,
      initiator_display_name: "Väntar på BankID",
      initiator_signed_at: new Date().toISOString(),
      scope,
      message,
      payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      status: "pending"
    })
    .select("id")
    .single<ConsentRow>();

  if (insertErr) {
    // Unique violation = race med success-page → hämta existerande
    if (insertErr.code === "23505") {
      const { data: raceWinner } = await sb
        .from("consents")
        .select("id")
        .eq("payment_intent_id", paymentIntentId)
        .single<ConsentRow>();
      return {
        ok: true,
        consent_id: raceWinner?.id,
        reason: "lost_race_to_success_page"
      };
    }
    // eslint-disable-next-line no-console
    console.error("[stripe/webhook] insert failed:", insertErr);
    return { ok: false, reason: `insert_failed: ${insertErr.message}` };
  }

  if (!created) {
    return { ok: false, reason: "no_row_returned" };
  }

  // Audit-event: payment_completed (samma som success-page skriver)
  await sb.rpc("append_audit_event", {
    p_consent_id: created.id,
    p_action: "payment_completed",
    p_actor_pno_hash: null,
    p_actor_role: "system",
    p_payload: {
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId,
      amount_total: session.amount_total,
      currency: session.currency,
      via: "webhook" // skiljer från via:"success_page" om det skulle behövas
    }
  });

  return { ok: true, consent_id: created.id, reason: "created" };
}

export async function POST(req: Request) {
  // Webhook fungerar bara i live-läge (kräver Supabase + Stripe)
  if (config.mode !== "live") {
    return NextResponse.json({ error: "webhook_requires_live_mode" }, { status: 503 });
  }

  if (!config.stripe.webhookSecret) {
    // eslint-disable-next-line no-console
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET saknas");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no_signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = stripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhookSecret
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Vi hanterar bara checkout.session.completed för MVP. Andra events
  // (refunds, disputes, etc.) returnerar 200 så Stripe inte retry:ar
  // — vi har bara inte byggt logik för dem än.
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const result = await handleCheckoutCompleted(session);

  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.warn("[stripe/webhook] handle failed:", result.reason);
    // Returnera 200 så Stripe inte retry:ar — vi har redan loggat. Retry
    // skulle bara skapa fler fel-loggar utan att lösa något.
    return NextResponse.json({ received: true, error: result.reason });
  }

  return NextResponse.json({ received: true, consent_id: result.consent_id });
}
