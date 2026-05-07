/**
 * Lightweight in-process rate limiter (token bucket-ish).
 *
 * Designval för MVP:
 *   - In-process Map: enkel, snabb, ingen extern beroende
 *   - Per-IP-bucket: tillräckligt för enkla angrepp
 *   - Sliding 60-sekunders fönster
 *
 * Begränsningar (kompromiss för MVP):
 *   - Förlorar state vid serverless cold start (Vercel) → angripare kan
 *     knäcka genom att vänta in cold-startsen. Ej prioritet på låg volym
 *   - Ingen dela mellan instanser i Vercel-deploy → varje instans har egen
 *     räknare. För 5/min-limits är detta i praktiken OK
 *
 * Uppgradering till v1.5 (när vi vet vi får trafik):
 *   - Byt till @upstash/ratelimit + Upstash Redis (deltas mellan instanser,
 *     persistent över cold starts, ~5ms latens)
 *   - Eller Vercel KV om vi redan deployar där
 *
 * Användning:
 *   const limit = checkRateLimit(req, "bankid_sign", { max: 5, windowMs: 60_000 });
 *   if (!limit.ok) return NextResponse.json({error:"rate_limit"}, {status:429});
 */

interface Bucket {
  windowStart: number;
  count: number;
}

const buckets: Map<string, Bucket> = (globalThis as unknown as {
  __concentRateBuckets?: Map<string, Bucket>;
}).__concentRateBuckets ?? new Map();

(globalThis as unknown as { __concentRateBuckets?: Map<string, Bucket> }).__concentRateBuckets =
  buckets;

export interface RateLimitOptions {
  max: number; // max requests per window
  windowMs: number; // window size i ms
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Identifierar IP från NextRequest. Tar hänsyn till proxy-headers
 * (Vercel sätter x-forwarded-for, x-real-ip).
 */
function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    // Format: "client, proxy1, proxy2" — vi tar första
    return fwd.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Kontrollerar rate-limit för (ip, scope). Returnerar ok=false om gränsen
 * passerats. Kallaren ska returnera HTTP 429 med Retry-After-header.
 */
export function checkRateLimit(
  req: Request,
  scope: string,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(req);
  const key = `${scope}:${ip}`;
  const now = Date.now();

  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= options.windowMs) {
    // Nytt fönster
    buckets.set(key, { windowStart: now, count: 1 });
    return { ok: true, remaining: options.max - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > options.max) {
    const elapsed = now - bucket.windowStart;
    const retryAfterMs = options.windowMs - elapsed;
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000))
    };
  }

  return {
    ok: true,
    remaining: options.max - bucket.count,
    retryAfterSeconds: 0
  };
}

/**
 * Hjälpfunktion: kör check + returnerar ev. 429-respons.
 * Routes använder denna för att slippa boilerplate.
 */
import { NextResponse } from "next/server";
export function rateLimitGuard(
  req: Request,
  scope: string,
  options: RateLimitOptions
): NextResponse | null {
  const result = checkRateLimit(req, scope, options);
  if (result.ok) return null;
  const response = NextResponse.json(
    { error: "rate_limit_exceeded", retry_after_seconds: result.retryAfterSeconds },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  return response;
}
