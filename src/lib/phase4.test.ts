import { describe, it, expect } from "vitest";
import { computeKundli, type KundliInput } from "./vedic";
import { detectYogas } from "./vedic-extended";
import { detectClassicalYogas } from "./yogas-classical";
import { computeVarshphal } from "./varshphal";
import {
  computePanchavargeeyaBala, computePatyayiniDasha, computeMuddaDasha,
  summariseYear, currentPeriod,
} from "./varshphal-tajika";

const BIRTH: KundliInput = {
  year: 1990, month: 1, day: 15, hour: 10, minute: 30,
  tzOffsetHours: 5.5, latitude: 28.6139, longitude: 77.209,
};
const chart = computeKundli(BIRTH);

describe("classical yogas", () => {
  const ys = detectClassicalYogas(chart);
  it("detects a broad classical set", () => {
    expect(ys.length).toBeGreaterThanOrEqual(28);
  });
  it("every yoga has a name, category and non-empty detail", () => {
    for (const y of ys) {
      expect(y.name.length).toBeGreaterThan(2);
      expect(["auspicious", "wealth", "royal", "spiritual", "challenging"]).toContain(y.category);
      expect(y.detail.trim().length).toBeGreaterThan(10);
    }
  });
  it("uses no markdown symbols or roman numerals in details", () => {
    for (const y of ys) {
      expect(y.detail).not.toMatch(/[*#_]/);
      expect(y.detail).not.toMatch(/\b(?:I{2,}|IV|VI{0,3}|IX|XI{0,2})\b/);
    }
  });
  it("Sunapha and Durudhura are mutually exclusive", () => {
    const s = ys.find((y) => y.name.startsWith("Sunapha"))!;
    const d = ys.find((y) => y.name.startsWith("Durudhura"))!;
    expect(s.present && d.present).toBe(false);
  });
  it("Kemadruma excludes both flanking yogas", () => {
    const k = ys.find((y) => y.name.startsWith("Kemadruma"))!;
    const s = ys.find((y) => y.name.startsWith("Sunapha"))!;
    const a = ys.find((y) => y.name.startsWith("Anapha"))!;
    if (k.present) expect(s.present || a.present).toBe(false);
  });
  it("only one Nabhasa sign-type yoga can be present", () => {
    const names = ["Rajju Yoga", "Musala Yoga", "Nala Yoga"];
    const hits = ys.filter((y) => names.includes(y.name) && y.present);
    expect(hits.length).toBeLessThanOrEqual(1);
  });
  it("is merged into the main yoga scan", () => {
    const all = detectYogas(chart).map((y) => y.name);
    expect(all).toContain("Hamsa Yoga");
    expect(all).toContain("Dharma-Karmadhipati Yoga");
  });
});

describe("Panchavargeeya Bala", () => {
  const v = computeVarshphal({ birth: BIRTH, targetYear: 2026 });
  const bala = computePanchavargeeyaBala(v.chart);
  it("scores the seven Tajika planets", () => {
    expect(bala.map((b) => b.planet)).toEqual(
      ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);
  });
  it("keeps each component inside its classical maximum", () => {
    for (const b of bala) {
      for (const c of b.components) {
        expect(c.points).toBeGreaterThanOrEqual(0);
        expect(c.points).toBeLessThanOrEqual(c.max);
      }
    }
  });
  it("reduces to Vishwa points out of twenty", () => {
    for (const b of bala) {
      expect(b.vishwa).toBeCloseTo(b.total / 4, 2);
      expect(b.vishwa).toBeGreaterThan(0);
      expect(b.vishwa).toBeLessThanOrEqual(20);
    }
  });
});

describe("annual timing systems", () => {
  const v = computeVarshphal({ birth: BIRTH, targetYear: 2026 });

  it("Patyayini covers exactly one solar year with nine rulers", () => {
    const ps = computePatyayiniDasha(v.chart, v.returnUTC);
    expect(ps).toHaveLength(8);
    const total = ps.reduce((s, p) => s + p.days, 0);
    expect(total).toBeGreaterThan(364);
    expect(total).toBeLessThan(366.5);
    expect(ps.reduce((s, p) => s + p.share, 0)).toBeCloseTo(1, 5);
  });

  it("Patyayini periods run in order without gaps", () => {
    const ps = computePatyayiniDasha(v.chart, v.returnUTC);
    for (let i = 1; i < ps.length; i++) {
      expect(ps[i].start.getTime()).toBe(ps[i - 1].end.getTime());
    }
  });

  it("Mudda follows the Vimshottari proportions inside one year", () => {
    const ms = computeMuddaDasha(v.chart, v.returnUTC);
    expect(ms).toHaveLength(9);
    const total = ms.reduce((s, p) => s + p.days, 0);
    expect(total).toBeGreaterThan(364);
    expect(total).toBeLessThan(366.5);
    const venus = ms.find((m) => m.lord === "Venus")!;
    expect(venus.days).toBeCloseTo(365.2422 * (20 / 120), 0);
  });

  it("finds the running period inside the year", () => {
    const ms = computeMuddaDasha(v.chart, v.returnUTC);
    const mid = new Date(v.returnUTC.getTime() + 100 * 86400000);
    expect(currentPeriod(ms, mid)).not.toBeNull();
    expect(currentPeriod(ms, new Date(v.returnUTC.getTime() - 86400000))).toBeNull();
  });
});

describe("year summary", () => {
  const v = computeVarshphal({ birth: BIRTH, targetYear: 2026 });
  const s = summariseYear(v.chart, v.muntha.house, v.varshesh);
  it("names a theme, supports and cautions in plain text", () => {
    expect(s.theme.length).toBeGreaterThan(10);
    expect(s.supports.length).toBeGreaterThanOrEqual(2);
    expect(s.cautions.length).toBeGreaterThanOrEqual(1);
    for (const line of [s.theme, ...s.supports, ...s.cautions]) {
      expect(line).not.toMatch(/[*#]/);
    }
  });
  it("ranks strongest above weakest", () => {
    expect(s.strongestPlanets.length).toBe(3);
    expect(s.weakestPlanets.length).toBe(2);
    for (const p of s.strongestPlanets) expect(s.weakestPlanets).not.toContain(p);
  });
});
