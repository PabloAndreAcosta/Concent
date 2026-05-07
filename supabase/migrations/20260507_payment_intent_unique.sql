-- Unique partial index på payment_intent_id för race-säkerhet mellan
-- Stripe webhook och payment-success-page. Båda kan försöka skapa consent
-- med samma payment_intent — den senare får 23505 SQLSTATE och behandlar
-- det som idempotent success.
--
-- Partial (where != null) eftersom test-mode-consents inte har payment_intent.

create unique index consents_payment_intent_unique
  on public.consents (payment_intent_id)
  where payment_intent_id is not null;
