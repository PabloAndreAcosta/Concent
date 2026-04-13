import { describe, expect, it } from "vitest";
import { computeActivatesAt, hoursUntil, isWindowOpen } from "../src/lib/consent/delay";

describe("3-dagarsfördröjningen", () => {
  it("aktiveringstid = signering + 72h som default", () => {
    const signed = new Date("2026-04-01T12:00:00Z");
    const activates = computeActivatesAt(signed);
    expect(activates.toISOString()).toBe("2026-04-04T12:00:00.000Z");
  });

  it("respekterar custom delay-timmar", () => {
    const signed = new Date("2026-04-01T00:00:00Z");
    const activates = computeActivatesAt(signed, 24);
    expect(activates.toISOString()).toBe("2026-04-02T00:00:00.000Z");
  });

  it("fönstret är stängt innan aktiveringstid", () => {
    const now = new Date("2026-04-02T00:00:00Z");
    const activates = new Date("2026-04-04T00:00:00Z");
    expect(isWindowOpen(now, activates, null)).toBe(false);
  });

  it("fönstret är öppet efter aktiveringstid", () => {
    const now = new Date("2026-04-05T00:00:00Z");
    const activates = new Date("2026-04-04T00:00:00Z");
    expect(isWindowOpen(now, activates, null)).toBe(true);
  });

  it("återkallat samtycke har alltid stängt fönster", () => {
    const now = new Date("2026-04-05T00:00:00Z");
    const activates = new Date("2026-04-04T00:00:00Z");
    const revoked = new Date("2026-04-04T12:00:00Z");
    expect(isWindowOpen(now, activates, revoked)).toBe(false);
  });

  it("hoursUntil clampar till 0 när tiden passerat", () => {
    const now = new Date("2026-04-10T00:00:00Z");
    const activates = new Date("2026-04-04T00:00:00Z");
    expect(hoursUntil(now, activates)).toBe(0);
  });
});
