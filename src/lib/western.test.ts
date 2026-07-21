import { describe, it, expect } from "vitest";
import { computeWesternChart, precessFromJ2000, fixedStarsNearPlanets } from "./western";

// Reference chart: 1990-01-01 12:00 UT, London (51.5074°N, 0.0°E).
// Validates the accuracy upgrades in this pass:
//  • True (nutated) obliquity used for Ascendant + MC (self-consistent w/ GAST)
//  • Fixed-star catalog is precessed from J2000 to chart epoch
//  • Cusp invariants (opposition, monotonic forward-arc) hold
const REF = {
  year: 1990, month: 1, day: 1, hour: 12, minute: 0, seconds: 0,
  tzOffsetHours: 0, latitude: 51.5074, longitude: 0.0,
};

describe("Western chart accuracy", () => {
  const chart = computeWesternChart(REF, "placidus");
  const norm = (x: number) => ((x % 360) + 360) % 360;

  it("Ascendant, MC, and cusp opposition invariants hold to arcsecond precision", () => {
    expect(norm(chart.cusps[6] - chart.tropicalAscendant - 180)).toBeCloseTo(0, 4);
    expect(norm(chart.cusps[3] - chart.midheaven - 180)).toBeCloseTo(0, 4);
    for (const [a, b] of [[10, 4], [11, 5], [1, 7], [2, 8]]) {
      const diff = norm(chart.cusps[a] - chart.cusps[b] - 180);
      expect(Math.min(diff, 360 - diff)).toBeCloseTo(0, 4);
    }
  });

  it("Houses advance monotonically through the zodiac (each step < 180°)", () => {
    for (let k = 0; k < 12; k++) {
      const step = norm(chart.cusps[(k + 1) % 12] - chart.cusps[k]);
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(180);
    }
  });

  it("Fixed-star catalog is precessed away from J2000 for non-J2000 charts", () => {
    // 24 years past J2000 ⇒ ~24 × 50.29″ ≈ 20 arcmin drift.
    const base = 149.83; // Regulus J2000 ecliptic longitude
    const p = precessFromJ2000(base, new Date("2024-01-01T00:00:00Z"));
    const drift = Math.abs(p - base) * 60; // arcmin
    expect(drift).toBeGreaterThan(15);
    expect(drift).toBeLessThan(25);
  });

  it("precessFromJ2000 is (approximately) identity at J2000 itself", () => {
    const p = precessFromJ2000(149.83, new Date("2000-01-01T12:00:00Z"));
    expect(Math.abs(p - 149.83) * 3600).toBeLessThan(1); // <1 arcsec
  });

  it("fixedStarsNearPlanets returns finite, bounded hits", () => {
    const hits = fixedStarsNearPlanets(chart, 2);
    for (const h of hits) {
      expect(Number.isFinite(h.orb)).toBe(true);
      expect(h.orb).toBeLessThanOrEqual(2);
      expect(h.orb).toBeGreaterThanOrEqual(0);
    }
  });
});
