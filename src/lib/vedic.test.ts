import { describe, expect, it } from "vitest";
import {
  computeKundli,
  lahiriAyanamsa,
  RASHIS,
  NAKSHATRAS,
} from "./vedic";

const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol;

describe("lahiriAyanamsa()", () => {
  it("at J2000.0 ≈ 23.85°", () => {
    // J2000.0 = 2000-01-01T12:00:00 TT ≈ UT 2000-01-01T11:58:56, use noon UT.
    const j2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    expect(near(lahiriAyanamsa(j2000), 23.85, 0.05)).toBe(true);
  });
  it("increases monotonically with time (~50.29\"/yr)", () => {
    const a1 = lahiriAyanamsa(new Date(Date.UTC(2000, 0, 1)));
    const a2 = lahiriAyanamsa(new Date(Date.UTC(2050, 0, 1)));
    expect(a2 - a1).toBeGreaterThan(0.68); // 50 * 50.29" ≈ 2515" ≈ 0.7°
    expect(a2 - a1).toBeLessThan(0.72);
  });
});

describe("computeKundli() — validation", () => {
  const base = {
    year: 1990, month: 6, day: 15, hour: 10, minute: 30,
    tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
  };
  it("rejects NaN inputs", () => {
    expect(() => computeKundli({ ...base, latitude: NaN })).toThrow();
  });
  it("rejects impossible calendar dates", () => {
    expect(() => computeKundli({ ...base, month: 2, day: 30 })).toThrow();
  });
  it("rejects out-of-range latitude", () => {
    expect(() => computeKundli({ ...base, latitude: 95 })).toThrow();
  });
});

describe("computeKundli() — reference case (New Delhi, 15 Jun 1990 10:30 IST)", () => {
  const chart = computeKundli({
    year: 1990, month: 6, day: 15, hour: 10, minute: 30,
    tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
  });

  it("produces 9 grahas", () => {
    expect(chart.planets).toHaveLength(9);
  });
  it("all planet longitudes are in [0, 360)", () => {
    for (const p of chart.planets) {
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
    }
  });
  it("Rahu and Ketu are exactly 180° apart", () => {
    const rahu = chart.planets.find((p) => p.name === "Rahu")!;
    const ketu = chart.planets.find((p) => p.name === "Ketu")!;
    const diff = ((ketu.longitude - rahu.longitude) % 360 + 360) % 360;
    expect(Math.abs(diff - 180)).toBeLessThan(1e-6);
  });
  it("houses are 12 consecutive rashi indices from Lagna", () => {
    expect(chart.houses).toHaveLength(12);
    for (let i = 1; i < 12; i++) {
      expect(chart.houses[i]).toBe((chart.houses[0] + i) % 12);
    }
  });
  it("Sun sidereal rashi is Taurus (Vrishabha)", () => {
    // 15 Jun 1990: tropical Sun ~24° Gemini → sidereal ~30° Taurus/1° Gemini
    // depending on rounding of ayanamsa. Both accepted.
    const sun = chart.planets.find((p) => p.name === "Sun")!;
    const rashi = RASHIS[sun.rashi];
    expect(["Taurus", "Gemini"]).toContain(rashi);
  });
  it("Moon nakshatra index is 0..26", () => {
    expect(chart.moonNakshatra.index).toBeGreaterThanOrEqual(0);
    expect(chart.moonNakshatra.index).toBeLessThan(NAKSHATRAS.length);
    expect(chart.moonNakshatra.pada).toBeGreaterThanOrEqual(1);
    expect(chart.moonNakshatra.pada).toBeLessThanOrEqual(4);
  });
});

describe("computeKundli() — determinism", () => {
  const input = {
    year: 1985, month: 3, day: 21, hour: 6, minute: 15,
    tzOffsetHours: -5, latitude: 40.7128, longitude: -74.0060,
  };
  it("same input → identical output", () => {
    const a = computeKundli(input);
    const b = computeKundli(input);
    expect(a.ayanamsa).toBe(b.ayanamsa);
    expect(a.ascendant.longitude).toBe(b.ascendant.longitude);
    for (let i = 0; i < a.planets.length; i++) {
      expect(a.planets[i].longitude).toBe(b.planets[i].longitude);
    }
  });
});
