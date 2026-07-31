import { describe, it, expect } from "vitest";
import { computeKundli } from "./vedic";

const RASHIS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
import { NAKSHATRAS } from "./vedic";

// Reference: India Independence, 15 Aug 1947, 00:00 IST, New Delhi.
// Widely-published Lahiri sidereal chart → Ascendant: Vrishabha (Taurus).
// This is our canonical Lagna regression: if this ever drifts, the ascendant
// pipeline (LST, obliquity, ayanamsa, or sign bucketing) has regressed.
describe("Kundli engine — canonical regression", () => {
  const chart = computeKundli({
    year: 1947, month: 8, day: 15, hour: 0, minute: 0, seconds: 0,
    tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
  });

  it("Ascendant rashi = Taurus (Vrishabha) for India Independence chart", () => {
    expect(RASHIS[chart.ascendant.rashi]).toBe("Taurus");
  });

  it("Ascendant degree within Taurus is finite and in [0,30)", () => {
    expect(Number.isFinite(chart.ascendant.degreeInRashi)).toBe(true);
    expect(chart.ascendant.degreeInRashi).toBeGreaterThanOrEqual(0);
    expect(chart.ascendant.degreeInRashi).toBeLessThan(30);
  });

  it("houses array follows whole-sign rotation from Lagna", () => {
    for (let i = 0; i < 12; i++) {
      expect(chart.houses[i]).toBe((chart.ascendant.rashi + i) % 12);
    }
  });

  it("Rahu and Ketu are exactly 180° apart", () => {
    const rahu = chart.planets.find((p) => p.name === "Rahu")!;
    const ketu = chart.planets.find((p) => p.name === "Ketu")!;
    const diff = ((rahu.longitude - ketu.longitude) % 360 + 360) % 360;
    expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 3);
  });

  it("every planet appears exactly once", () => {
    const names = chart.planets.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(9); // Su, Mo, Ma, Me, Ju, Ve, Sa, Ra, Ke
  });

  it("moonNakshatra matches the Moon's sidereal longitude", () => {
    const moon = chart.planets.find((p) => p.name === "Moon")!;
    const nak = Math.floor(moon.longitude / (360 / 27));
    expect(chart.moonNakshatra.index).toBe(nak);
  });
});

// All 12 possible Lagnas: run 12 charts spaced through the day and verify each
// ascendant is a valid rashi and the whole-sign house wheel is well-formed.
describe("Kundli engine — 12-Lagna sweep", () => {
  const seen = new Set<number>();
  for (let h = 0; h < 24; h += 2) {
    const chart = computeKundli({
      year: 2000, month: 6, day: 21, hour: h, minute: 0, seconds: 0,
      tzOffsetHours: 5.5, latitude: 19.076, longitude: 72.877, // Mumbai
    });
    seen.add(chart.ascendant.rashi);
    it(`h=${h} produces a valid ascendant + whole-sign wheel`, () => {
      expect(chart.ascendant.rashi).toBeGreaterThanOrEqual(0);
      expect(chart.ascendant.rashi).toBeLessThan(12);
      expect(new Set(chart.houses).size).toBe(12);
    });
  }
  it("sweep covers at least 10 distinct Lagnas across the day", () => {
    expect(seen.size).toBeGreaterThanOrEqual(10);
  });
});

// ────────────────────────────────────────────────────────────────
// Reference-chart assertions (locked against known published facts and
// cross-checked against the corrected engine). Guards against regressions
// in ascendant sign/degree, sidereal longitudes, nakshatra/pada, and
// Vimshottari dasha-at-birth.
// ────────────────────────────────────────────────────────────────
import { computeVimshottari } from "./vedic-extended";

describe("Reference chart 1 — India Independence, 15 Aug 1947 00:00 IST, New Delhi", () => {
  const input = {
    year: 1947, month: 8, day: 15, hour: 0, minute: 0, seconds: 0,
    tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
  };
  const chart = computeKundli(input);
  const moon = chart.planets.find((p) => p.name === "Moon")!;

  it("Ascendant is Taurus", () => {
    expect(RASHIS[chart.ascendant.rashi]).toBe("Taurus");
  });
  it("Moon is in Cancer, Pushya nakshatra (widely published fact)", () => {
    expect(RASHIS[moon.rashi]).toBe("Cancer");
    expect(NAKSHATRAS[moon.nakshatra]).toBe("Pushya");
    expect(moon.pada).toBe(1);
  });
  it("Dasha running at birth is Saturn Mahadasha (Pushya is Saturn-ruled)", () => {
    const NAK_SPAN = 360 / 27;
    const birth = new Date(Date.UTC(1947, 7, 15, 0, 0, 0) - 5.5 * 3600000);
    const degInNak = moon.longitude % NAK_SPAN;
    const dasha = computeVimshottari(birth, chart.moonNakshatra.index, degInNak);
    expect(dasha.maha[0].lord).toBe("Saturn");
    expect(dasha.currentMaha.lord === "Saturn" || dasha.maha[0].lord === "Saturn").toBe(true);
  });
});

describe("Reference chart 2 — New Delhi, 15 Jun 1990 10:30 IST", () => {
  const input = {
    year: 1990, month: 6, day: 15, hour: 10, minute: 30,
    tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.2090,
  };
  const chart = computeKundli(input);
  const moon = chart.planets.find((p) => p.name === "Moon")!;
  const sun = chart.planets.find((p) => p.name === "Sun")!;

  it("Ascendant is Leo", () => {
    expect(RASHIS[chart.ascendant.rashi]).toBe("Leo");
  });
  it("Sun is in Gemini", () => {
    expect(RASHIS[sun.rashi]).toBe("Gemini");
  });
  it("Moon is in Aquarius, Shatabhisha nakshatra pada 4", () => {
    expect(RASHIS[moon.rashi]).toBe("Aquarius");
    expect(NAKSHATRAS[moon.nakshatra]).toBe("Shatabhisha");
    expect(moon.pada).toBe(4);
  });
  it("Dasha at birth is Rahu Mahadasha (Shatabhisha is Rahu-ruled)", () => {
    const NAK_SPAN = 360 / 27;
    const birth = new Date(Date.UTC(1990, 5, 15, 10, 30, 0) - 5.5 * 3600000);
    const degInNak = moon.longitude % NAK_SPAN;
    const dasha = computeVimshottari(birth, chart.moonNakshatra.index, degInNak);
    expect(dasha.maha[0].lord).toBe("Rahu");
  });
});

describe("Reference chart 3 — New York, 21 Mar 1985 06:15 EST", () => {
  const input = {
    year: 1985, month: 3, day: 21, hour: 6, minute: 15,
    tzOffsetHours: -5, latitude: 40.7128, longitude: -74.0060,
  };
  const chart = computeKundli(input);
  const moon = chart.planets.find((p) => p.name === "Moon")!;

  it("Ascendant is Pisces", () => {
    expect(RASHIS[chart.ascendant.rashi]).toBe("Pisces");
  });
  it("Moon is in Pisces, Uttara Bhadrapada nakshatra pada 2", () => {
    expect(RASHIS[moon.rashi]).toBe("Pisces");
    expect(NAKSHATRAS[moon.nakshatra]).toBe("Uttara Bhadrapada");
    expect(moon.pada).toBe(2);
  });
  it("Dasha at birth is Saturn Mahadasha (Uttara Bhadrapada is Saturn-ruled)", () => {
    const NAK_SPAN = 360 / 27;
    const birth = new Date(Date.UTC(1985, 2, 21, 6, 15, 0) + 5 * 3600000);
    const degInNak = moon.longitude % NAK_SPAN;
    const dasha = computeVimshottari(birth, chart.moonNakshatra.index, degInNak);
    expect(dasha.maha[0].lord).toBe("Saturn");
  });
});

describe("Invariant — Ketu is always exactly Rahu + 180°, across many charts", () => {
  const cases = [
    { year: 2000, month: 1, day: 1, hour: 0, minute: 0, tzOffsetHours: 0, latitude: 51.5, longitude: -0.12 },
    { year: 1975, month: 11, day: 3, hour: 14, minute: 45, tzOffsetHours: 9, latitude: 35.68, longitude: 139.69 },
    { year: 2020, month: 7, day: 4, hour: 23, minute: 59, tzOffsetHours: -8, latitude: 34.05, longitude: -118.24 },
  ];
  for (const c of cases) {
    it(`Rahu/Ketu 180° apart + both retrograde (${c.year}-${c.month}-${c.day})`, () => {
      const chart = computeKundli(c);
      const rahu = chart.planets.find((p) => p.name === "Rahu")!;
      const ketu = chart.planets.find((p) => p.name === "Ketu")!;
      const diff = ((ketu.longitude - rahu.longitude + 360) % 360 + 360) % 360;
      expect(Math.min(diff, 360 - diff)).toBeCloseTo(180, 4);
      expect(rahu.retrograde).toBe(true);
      expect(ketu.retrograde).toBe(true);
    });
  }
});
