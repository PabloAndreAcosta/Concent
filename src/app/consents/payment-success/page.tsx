import { redirect } from "next/navigation";
import { stripeClient } from "@/lib/stripe/client";
import { config } from "@/lib/config";
import { dal } from "@/lib/dal";

export const dynamic = "force-dynamic";

/**
 * Landing efter Stripe Checkout slutförd. Server-renderad så vi kan:
 *   1. Verifiera session.payment_status === "paid"
 *   2. Skapa consent med scope/message från session-metadata
 *   3. Markera consent som betald (payment_intent_id + paid_at)
 *   4. Redirect till BankID-signering
 *
 * Idempotens: om sidan reload:as efter consent skapats letar vi efter
 * existerande consent med samma payment_intent_id. Inget behov av webhook
 * för v1 — webhook lägger vi till i v1.5 som backstop om browser stängs.
 */
export default async function PaymentSuccessPage({
  searchParams
}: {
  searchParams: { session_id?: string };
}) {
  if (config.mode !== "live") {
    // Test-läge ska aldrig hamna här (create-checkout redirectar direkt till sign)
    redirect("/consents/new?error=unexpected_test_path");
  }

  const sessionId = searchParams.session_id;
  if (!sessionId) {
    redirect("/consents/new?error=missing_session");
  }

  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"]
  });

  if (session.payment_status !== "paid") {
    redirect(`/consents/new?error=not_paid&status=${session.payment_status}`);
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    redirect("/consents/new?error=no_payment_intent");
  }

  // Idempotens: kolla om consent redan skapats för detta payment_intent
  const { serviceClient } = await import("@/lib/supabase/client");
  const sb = serviceClient();
  const { data: existing } = await sb
    .from("consents")
    .select("id")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (existing) {
    redirect(`/consents/${existing.id}/sign?role=initiator`);
  }

  // Skapa consent med tomma initiator-fält som fylls i vid BankID-signering
  // (initiator_pno_hash + display_name uppdateras av callback-routen)
  const scope = session.metadata?.scope ?? "";
  const message = session.metadata?.message || null;

  if (!scope) {
    redirect("/consents/new?error=missing_scope_in_session");
  }

  // Vi har inte initiator-info än (det kommer från BankID), men vi måste skapa
  // raden nu så payment_intent_id är ihopkopplat. Vi använder placeholder som
  // sedan skrivs över i BankID-callback. För att inte bryta NOT NULL-constraints
  // sätter vi temporära värden.
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
    .single();

  if (insertErr || !created) {
    // eslint-disable-next-line no-console
    console.error("[payment-success] consent insert failed:", insertErr);
    redirect("/consents/new?error=consent_create_failed");
  }

  // Audit-event: payment_completed
  await sb.rpc("append_audit_event", {
    p_consent_id: created.id,
    p_action: "payment_completed",
    p_actor_pno_hash: null,
    p_actor_role: "system",
    p_payload: {
      stripe_session_id: sessionId,
      stripe_payment_intent: paymentIntentId,
      amount_total: session.amount_total,
      currency: session.currency
    }
  });

  // Note: dal() används inte här eftersom vi behöver bypassa NOT NULL-checken
  // för initiator_pno_hash innan BankID kört. Det är OK — DAL.signConsent()
  // kommer skriva över med riktiga värden i callback-routen.
  void dal; // avoid unused import warning

  redirect(`/consents/${created.id}/sign?role=initiator&payment=success`);
}
