/**
 * 3-dagarsfördröjningen är hela poängen med Concent.
 * Ändra inte default 72h utan att läsa AGENTS.md först — det är en designspärr,
 * inte en bug. Idén är att samtycke kräver eftertanke över tid.
 */
import { config } from "@/lib/config";

export function computeActivatesAt(bothSignedAt: Date, delayHours = config.consentDelayHours): Date {
  return new Date(bothSignedAt.getTime() + delayHours * 3600_000);
}

export function isWindowOpen(now: Date, activatesAt: Date | null, revokedAt: Date | null): boolean {
  if (revokedAt) return false;
  if (!activatesAt) return false;
  return now.getTime() >= activatesAt.getTime();
}

export function hoursUntil(now: Date, activatesAt: Date): number {
  return Math.max(0, (activatesAt.getTime() - now.getTime()) / 3600_000);
}
