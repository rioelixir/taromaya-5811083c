import { describe, it, expect } from "vitest";
import { computeChara, computeNarayana, computeKalachakra, signPeriodYears, isOddFooted, KALACHAKRA_SIGN_YEARS } from "./dasha-sign";

const chart = {
  ascendant: { rashi: 0 },
  planets: [
    { name: "Sun", rashi: 3 },
    { name: "Moon", rashi: 1 },
    { name: "Mars", rashi: 9 },
    { name: "Mercury", rashi: 5 },
    { name: "Jupiter", rashi: 3 },
    { name: "Venus", rashi: 11 },
    { name: "Saturn", rashi: 6 },
    { name: "Rahu", rashi: 2 },
    { name: "Ketu", rashi: 8 },
  ],
};
const birth = new Date(Date.UTC(1990, 4, 15, 6, 30));

describe("sign dashas", () => {
  it("marks footedness classically", () => {
    expect(isOddFooted(0)).toBe(true);
    expect(isOddFooted(3)).toBe(false);
    expect(isOddFooted(8)).toBe(true);
    expect(isOddFooted(11)).toBe(false);
  });

  it("keeps sign periods within 1..12 years", () => {
    for (let s = 0; s < 12; s++) {
      const y = signPeriodYears(chart, s);
      expect(y).toBeGreaterThanOrEqual(1);
      expect(y).toBeLessThanOrEqual(12);
    }
  });

  for (const [name, tree] of [
    ["chara", computeChara(chart, birth)],
    ["narayana", computeNarayana(chart, birth)],
    ["kalachakra", computeKalachakra(birth, 42)],
  ] as const) {
    it(`${name} builds a continuous three-level tree`, () => {
      expect(tree.maha.length).toBeGreaterThan(11);
      for (let i = 1; i < tree.maha.length; i++) {
        expect(tree.maha[i].start.getTime()).toBe(tree.maha[i - 1].end.getTime());
      }
      const m = tree.maha[0];
      expect(m.antar).toHaveLength(12);
      expect(m.antar[0].start.getTime()).toBe(m.start.getTime());
      expect(m.antar[11].end.getTime()).toBeCloseTo(m.end.getTime(), -3);
      expect(m.antar[0].pratyantar).toHaveLength(12);
      expect(tree.currentMaha.lord).toMatch(/\(/);
    });
  }

  it("uses classical kalachakra year values", () => {
    expect(KALACHAKRA_SIGN_YEARS.reduce((a, b) => a + b, 0)).toBe(118);
  });
});
